import urllib.request
import struct
import json
import os
import sys

URL = "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/EarthClouds_1_12756.glb"
SAVE_DIR = os.path.abspath("frontend/public/models")
ORIGINAL_PATH = os.path.join(SAVE_DIR, "EarthClouds_1_12756_original.glb")
os.makedirs(SAVE_DIR, exist_ok=True)

if not os.path.exists(ORIGINAL_PATH) or os.path.getsize(ORIGINAL_PATH) == 0:
    print(f"Downloading from {URL} to {ORIGINAL_PATH}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(URL, headers=headers)
    with urllib.request.urlopen(req) as resp, open(ORIGINAL_PATH, 'wb') as out_file:
        total = int(resp.headers.get('content-length', 0))
        downloaded = 0
        while True:
            chunk = resp.read(65536)
            if not chunk:
                break
            downloaded += len(chunk)
            out_file.write(chunk)
            if total > 0:
                percent = downloaded / total * 100
                sys.stdout.write(f"\rDownloading: {downloaded}/{total} bytes ({percent:.1f}%)")
                sys.stdout.flush()
    print("\nDownload complete!")
else:
    print(f"File already exists at {ORIGINAL_PATH} (size: {os.path.getsize(ORIGINAL_PATH)} bytes)")

print("\n--- GLB PARSING & INSPECTION ---")
with open(ORIGINAL_PATH, "rb") as f:
    # Read GLB header: magic (4), version (4), length (4)
    magic, version, length = struct.unpack("<4sII", f.read(12))
    print(f"Magic: {magic.decode('ascii')}, Version: {version}, Total Length: {length} bytes")
    
    # Chunk 0: JSON
    chunk0_length, chunk0_type = struct.unpack("<I4s", f.read(8))
    print(f"Chunk 0 Length: {chunk0_length}, Type: {chunk0_type.decode('ascii')}")
    json_bytes = f.read(chunk0_length)
    gltf = json.loads(json_bytes.decode('utf-8'))
    
    # Chunk 1: BIN (if present)
    chunk1_header = f.read(8)
    if len(chunk1_header) == 8:
        chunk1_length, chunk1_type = struct.unpack("<I4s", chunk1_header)
        print(f"Chunk 1 Length: {chunk1_length}, Type: {chunk1_type.decode('ascii')}")
    else:
        print("No Chunk 1 (BIN)")

print("\n--- GLTF Structure ---")
print("Generator / Asset info:", gltf.get("asset"))
print("Scenes:", len(gltf.get("scenes", [])))
print("Nodes:", len(gltf.get("nodes", [])))
for i, node in enumerate(gltf.get("nodes", [])):
    print(f"  Node {i}: name='{node.get('name')}', mesh={node.get('mesh')}, children={node.get('children')}, translation={node.get('translation')}, rotation={node.get('rotation')}, scale={node.get('scale')}")

print("\nMeshes:", len(gltf.get("meshes", [])))
total_primitives = 0
for i, mesh in enumerate(gltf.get("meshes", [])):
    print(f"  Mesh {i}: name='{mesh.get('name')}', primitives count={len(mesh.get('primitives', []))}")
    for j, prim in enumerate(mesh.get("primitives", [])):
        total_primitives += 1
        mat_id = prim.get("material")
        mat_name = gltf.get("materials", [])[mat_id].get("name") if mat_id is not None and mat_id < len(gltf.get("materials", [])) else "None"
        attrs = list(prim.get("attributes", {}).keys())
        indices_acc = prim.get("indices")
        indices_count = gltf.get("accessors", [])[indices_acc].get("count") if indices_acc is not None else "N/A"
        print(f"    Primitive {j}: material=[{mat_id}] '{mat_name}', attributes={attrs}, indices count={indices_count}")

print(f"\nMaterials ({len(gltf.get('materials', []))}):")
for i, mat in enumerate(gltf.get("materials", [])):
    print(f"  Material {i}: name='{mat.get('name')}'")
    print(f"    alphaMode: {mat.get('alphaMode', 'OPAQUE')}, doubleSided: {mat.get('doubleSided', False)}")
    pbr = mat.get("pbrMetallicRoughness", {})
    print(f"    pbrMetallicRoughness: baseColorFactor={pbr.get('baseColorFactor')}, metallic={pbr.get('metallicFactor')}, roughness={pbr.get('roughnessFactor')}")
    if "baseColorTexture" in pbr:
        tex_id = pbr["baseColorTexture"].get("index")
        print(f"    baseColorTexture index: {tex_id}")
    if "normalTexture" in mat:
        print(f"    normalTexture index: {mat['normalTexture'].get('index')}")
    if "emissiveTexture" in mat:
        print(f"    emissiveTexture index: {mat['emissiveTexture'].get('index')}")
    if "occlusionTexture" in mat:
        print(f"    occlusionTexture index: {mat['occlusionTexture'].get('index')}")

print(f"\nTextures ({len(gltf.get('textures', []))}):")
for i, tex in enumerate(gltf.get("textures", [])):
    source_img_id = tex.get("source")
    sampler_id = tex.get("sampler")
    print(f"  Texture {i}: source_image={source_img_id}, sampler={sampler_id}")

print(f"\nImages ({len(gltf.get('images', []))}):")
for i, img in enumerate(gltf.get("images", [])):
    name = img.get("name")
    mimeType = img.get("mimeType")
    bufferView = img.get("bufferView")
    bv_info = gltf.get("bufferViews", [])[bufferView] if bufferView is not None else {}
    byteLength = bv_info.get("byteLength", 0)
    print(f"  Image {i}: name='{name}', mimeType={mimeType}, bufferView={bufferView}, size={byteLength/1024:.1f} KB")

print(f"\nAnimations ({len(gltf.get('animations', []))}):")
for i, anim in enumerate(gltf.get("animations", [])):
    print(f"  Animation {i}: name='{anim.get('name')}', channels={len(anim.get('channels', []))}")

# Check vertex counts from accessors
pos_counts = []
for mesh in gltf.get("meshes", []):
    for prim in mesh.get("primitives", []):
        pos_acc = prim.get("attributes", {}).get("POSITION")
        if pos_acc is not None:
            acc = gltf.get("accessors", [])[pos_acc]
            pos_counts.append(acc.get("count", 0))
            print(f"Mesh position accessor: count={acc.get('count')}, min={acc.get('min')}, max={acc.get('max')}")

# Save json manifest for inspection
with open(os.path.join(SAVE_DIR, "model_structure.json"), "w") as out_json:
    json.dump(gltf, out_json, indent=2)
print(f"\nSaved GLTF metadata to {os.path.join(SAVE_DIR, 'model_structure.json')}")
