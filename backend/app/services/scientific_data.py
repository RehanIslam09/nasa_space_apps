import math
from typing import List, Dict, Any, Optional, Tuple

class ScientificDataEngine:
    """
    Processes numerical scientific variables directly, preserving units,
    applying percentile-based normalization, and calculating robust statistics.
    """
    
    @staticmethod
    def handle_missing_values(values: List[Optional[float]], strategy: str = "interpolate") -> List[float]:
        """
        Cleans and imputes missing or NaN values.
        Strategies: 'interpolate', 'mean', 'zero'
        """
        if not values:
            return []
            
        valid_vals = [v for v in values if v is not None and not math.isnan(v)]
        if not valid_vals:
            return [0.0] * len(values)
            
        mean_val = sum(valid_vals) / len(valid_vals)
        
        result: List[float] = []
        for i, val in enumerate(values):
            if val is not None and not math.isnan(val):
                result.append(float(val))
            else:
                if strategy == "zero":
                    result.append(0.0)
                elif strategy == "mean":
                    result.append(mean_val)
                elif strategy == "interpolate":
                    # Simple linear interpolation with neighbors
                    prev_v = next((values[j] for j in range(i - 1, -1, -1) if values[j] is not None and not math.isnan(values[j])), mean_val)
                    next_v = next((values[j] for j in range(i + 1, len(values)) if values[j] is not None and not math.isnan(values[j])), mean_val)
                    result.append((prev_v + next_v) / 2.0)
                else:
                    result.append(mean_val)
        return result

    @staticmethod
    def normalize_min_max(values: List[float], min_val: Optional[float] = None, max_val: Optional[float] = None) -> List[float]:
        """
        Standard min-max normalization into [0.0, 1.0].
        Handles edge case where all values are identical.
        """
        if not values:
            return []
            
        v_min = min_val if min_val is not None else min(values)
        v_max = max_val if max_val is not None else max(values)
        
        denom = v_max - v_min
        if abs(denom) < 1e-9:
            return [0.5] * len(values) # Default center when constant
            
        return [max(0.0, min(1.0, (x - v_min) / denom)) for x in values]

    @staticmethod
    def normalize_percentile(values: List[float], p_low: float = 2.0, p_high: float = 98.0) -> List[float]:
        """
        Robust percentile normalization to eliminate visual/sensor outliers.
        """
        if not values:
            return []
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        idx_low = int(n * (p_low / 100.0))
        idx_high = min(n - 1, int(n * (p_high / 100.0)))
        
        v_min = sorted_vals[idx_low]
        v_max = sorted_vals[idx_high]
        
        denom = v_max - v_min
        if abs(denom) < 1e-9:
            return [0.5] * len(values)
            
        return [max(0.0, min(1.0, (x - v_min) / denom)) for x in values]

    @staticmethod
    def compute_summary_statistics(values: List[float], variable_name: str, unit: str) -> Dict[str, Any]:
        """
        Generates statistical summaries for scientific data transparency.
        """
        if not values:
            return {"count": 0, "variable": variable_name, "unit": unit}
            
        n = len(values)
        mean_val = sum(values) / n
        sorted_v = sorted(values)
        median_val = sorted_v[n // 2] if n % 2 != 0 else (sorted_v[n // 2 - 1] + sorted_v[n // 2]) / 2.0
        
        variance = sum((x - mean_val) ** 2 for x in values) / max(1, n - 1)
        std_val = math.sqrt(variance)
        
        # Calculate trend (simple linear regression slope over index)
        if n > 1:
            x_vals = list(range(n))
            x_mean = (n - 1) / 2.0
            numerator = sum((i - x_mean) * (values[i] - mean_val) for i in range(n))
            denominator = sum((i - x_mean) ** 2 for i in range(n))
            slope = numerator / max(1e-9, denominator)
        else:
            slope = 0.0
            
        return {
            "variable_name": variable_name,
            "unit": unit,
            "count": n,
            "min": round(min(values), 4),
            "max": round(max(values), 4),
            "mean": round(mean_val, 4),
            "median": round(median_val, 4),
            "std_dev": round(std_val, 4),
            "trend_slope": round(slope, 6),
            "trend_direction": "increasing" if slope > 1e-4 else ("decreasing" if slope < -1e-4 else "stable")
        }
