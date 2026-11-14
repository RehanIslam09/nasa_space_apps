import json
import struct
import os
from PIL import Image
import io

ORIGINAL_GLB = "frontend/public/models/EarthClouds_1_12756_original.glb"
OPTIMIZED_GLB = "frontend/public/models/EarthClouds_1_12756_optimized.glb"

with open(ORIGINAL_GLB, "rb") as f:
    magic, version, length = struct.unpack("<4sII", f.read(12))
    chunk0_length, chunk0_type = struct.unpack("<I4s", f.read(8))
    gltf = json.loads(f.read(chunk0_length).decode('utf-8'))
    chunk1_length, chunk1_type = struct.unpack("<I4s", f.read(8))
    bin_data = f.read(chunk1_length)

print(f"Original GLB size: {length} bytes ({length / (1024*1024):.2f} MB)")

# Compress images
# Image 0: earth_norm.jpg (currently PNG in GLB, size 2.5MB)
# Image 1: earthClouds_diff.jpg (currently PNG in GLB, size 15.87MB)

buffer_views = gltf["bufferViews"]
images = gltf["images"]

new_bin_parts = []
new_buffer_views = []

# First, keep all non-image buffer views (vertices, normals, UVs, indices)
# Let's find which buffer views belong to images
image_bv_indices = {img["bufferView"]: i for i, img in enumerate(images)}

# Non-image buffer views
current_offset = 0
bv_index_map = {}
for i, bv in enumerate(buffer_views):
    if i not in image_bv_indices:
        old_offset = bv.get("byteOffset", 0)
        old_length = bv["byteLength"]
        data = bin_data[old_offset : old_offset + old_length]
        
        # Pad to 4-byte alignment
        padding = (4 - (len(data) % 4)) % 4
        data += b'\x00' * padding
        
        new_bv = dict(bv)
        new_bv["byteOffset"] = current_offset
        new_bv["byteLength"] = old_length
        new_buffer_views.append(new_bv)
        new_bin_parts.append(data)
        
        bv_index_map[i] = len(new_buffer_views) - 1
        current_offset += len(data)

# Now optimize and append image buffer views
for i, img in enumerate(images):
    old_bv_idx = img["bufferView"]
    old_bv = buffer_views[old_bv_idx]
    old_offset = old_bv.get("byteOffset", 0)
    old_length = old_bv["byteLength"]
    img_data = bin_data[old_offset : old_offset + old_length]
    
    pil_img = Image.open(io.BytesIO(img_data))
    print(f"Processing Image {i} ({img.get('name')}): original format={pil_img.format}, size={pil_img.size}, mode={pil_img.mode}")
    
    out_buf = io.BytesIO()
    if pil_img.mode == 'RGBA':
        # Check if alpha is needed (all 255)
        # Convert to RGB
        pil_img_rgb = pil_img.convert('RGB')
    else:
        pil_img_rgb = pil_img
    
    # Save as high quality JPEG (quality 92 for diff, 95 for normal)
    q = 95 if i == 0 else 92
    pil_img_rgb.save(out_buf, format="JPEG", quality=q, optimize=True)
    optimized_data = out_buf.getvalue()
    
    # 4-byte padding
    padding = (4 - (len(optimized_data) % 4)) % 4
    padded_data = optimized_data + b'\x00' * padding
    
    new_bv = {
        "buffer": 0,
        "byteOffset": current_offset,
        "byteLength": len(optimized_data)
    }
    new_buffer_views.append(new_bv)
    new_img_bv_idx = len(new_buffer_views) - 1
    new_bin_parts.append(padded_data)
    
    current_offset += len(padded_data)
    
    # Update image definition
    img["bufferView"] = new_img_bv_idx
    img["mimeType"] = "image/jpeg"
    print(f"  Optimized: {len(img_data)/1024:.1f} KB -> {len(optimized_data)/1024:.1f} KB ({len(optimized_data)/len(img_data)*100:.1f}%)")

# Update accessors bufferView indices
for acc in gltf["accessors"]:
    if "bufferView" in acc:
        acc["bufferView"] = bv_index_map[acc["bufferView"]]

# Update buffer
new_bin_data = b''.join(new_bin_parts)
gltf["bufferViews"] = new_buffer_views
gltf["buffers"][0]["byteLength"] = len(new_bin_data)

# Re-serialize JSON
new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
# Pad JSON chunk to 4-byte alignment with space b' '
json_padding = (4 - (len(new_json_bytes) % 4)) % 4
new_json_bytes += b' ' * json_padding

# Write new GLB
new_chunk0_length = len(new_json_bytes)
new_chunk1_length = len(new_bin_data)
new_total_length = 12 + 8 + new_chunk0_length + 8 + new_chunk1_length

with open(OPTIMIZED_GLB, "wb") as f:
    # Header
    f.write(struct.pack("<4sII", b"glTF", 2, new_total_length))
    # Chunk 0 (JSON)
    f.write(struct.pack("<II", new_chunk0_length, 0x4E4F534A)) # JSON
    f.write(new_json_bytes)
    # Chunk 1 (BIN)
    f.write(struct.pack("<II", new_chunk1_length, 0x004E4942)) # BIN
    f.write(new_bin_data)

print(f"\nSuccessfully generated {OPTIMIZED_GLB}!")
print(f"Optimized GLB size: {os.path.getsize(OPTIMIZED_GLB)} bytes ({os.path.getsize(OPTIMIZED_GLB)/(1024*1024):.2f} MB)")
print(f"Total size reduction: {(1 - os.path.getsize(OPTIMIZED_GLB)/length)*100:.1f}%")
