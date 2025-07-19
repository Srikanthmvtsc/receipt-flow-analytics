from typing import List, Dict, Any, Optional, Callable
import statistics
from collections import Counter, defaultdict
from datetime import datetime
import re

class SearchAlgorithms:
    """Implementation of various search algorithms for receipt data"""
    
    @staticmethod
    def linear_search(data: List[Dict], field: str, value: Any) -> List[Dict]:
        """O(n) linear search implementation"""
        results = []
        for item in data:
            if item.get(field) == value:
                results.append(item)
        return results
    
    @staticmethod
    def keyword_search(data: List[Dict], keyword: str, fields: List[str]) -> List[Dict]:
        """Multi-field keyword search with string matching"""
        keyword_lower = keyword.lower()
        results = []
        
        for item in data:
            for field in fields:
                field_value = str(item.get(field, '')).lower()
                if keyword_lower in field_value:
                    results.append(item)
                    break  # Avoid duplicates
        return results
    
    @staticmethod
    def range_search(data: List[Dict], field: str, min_val: Optional[Any] = None, 
                    max_val: Optional[Any] = None) -> List[Dict]:
        """Range-based search for numerical and date fields"""
        results = []
        for item in data:
            value = item.get(field)
            if value is None:
                continue
                
            # Convert string dates to comparable format
            if isinstance(value, str) and re.match(r'\d{4}-\d{2}-\d{2}', value):
                try:
                    value = datetime.strptime(value, '%Y-%m-%d')
                    if min_val:
                        min_val = datetime.strptime(min_val, '%Y-%m-%d') if isinstance(min_val, str) else min_val
                    if max_val:
                        max_val = datetime.strptime(max_val, '%Y-%m-%d') if isinstance(max_val, str) else max_val
                except ValueError:
                    continue
            
            # Apply range filter
            if min_val is not None and value < min_val:
                continue
            if max_val is not None and value > max_val:
                continue
                
            results.append(item)
        return results
    
    @staticmethod
    def pattern_search(data: List[Dict], field: str, pattern: str) -> List[Dict]:
        """Regex pattern-based search"""
        results = []
        try:
            regex = re.compile(pattern, re.IGNORECASE)
            for item in data:
                field_value = str(item.get(field, ''))
                if regex.search(field_value):
                    results.append(item)
        except re.error:
            # Invalid regex pattern
            return []
        return results

class SortingAlgorithms:
    """Implementation of efficient sorting algorithms"""
    
    @staticmethod
    def timsort(data: List[Dict], key_func: Callable, reverse: bool = False) -> List[Dict]:
        """Python's native Timsort (O(n log n) average case)"""
        return sorted(data, key=key_func, reverse=reverse)
    
    @staticmethod
    def multi_field_sort(data: List[Dict], sort_fields: List[tuple]) -> List[Dict]:
        """Multi-field sorting with custom priority
        sort_fields: [(field_name, reverse_bool), ...]
        """
        def sort_key(item):
            return tuple(
                item.get(field, '') if not reverse else -item.get(field, 0) 
                if isinstance(item.get(field), (int, float)) else item.get(field, '')
                for field, reverse in sort_fields
            )
        
        return sorted(data, key=sort_key)
    
    @staticmethod
    def quicksort(arr: List[Any], key_func: Callable = None) -> List[Any]:
        """Custom quicksort implementation (O(n log n) average case)"""
        if len(arr) <= 1:
            return arr
        
        key_func = key_func or (lambda x: x)
        pivot = arr[len(arr) // 2]
        pivot_key = key_func(pivot)
        
        left = [x for x in arr if key_func(x) < pivot_key]
        middle = [x for x in arr if key_func(x) == pivot_key]
        right = [x for x in arr if key_func(x) > pivot_key]
        
        return SortingAlgorithms.quicksort(left, key_func) + middle + SortingAlgorithms.quicksort(right, key_func)

class AggregationAlgorithms:
    """Statistical aggregation and analysis functions"""
    
    @staticmethod
    def calculate_basic_stats(amounts: List[float]) -> Dict[str, float]:
        """Calculate sum, mean, median, mode of expenditure"""
        if not amounts:
            return {'sum': 0, 'mean': 0, 'median': 0, 'mode': 0}
        
        # Sum aggregation
        total_sum = sum(amounts)
        
        # Mean calculation
        mean_val = statistics.mean(amounts)
        
        # Median calculation (O(n log n) with sorting)
        median_val = statistics.median(amounts)
        
        # Mode calculation (most frequent value)
        try:
            mode_val = statistics.mode([round(amt, 2) for amt in amounts])
        except statistics.StatisticsError:
            # No single mode, use median as fallback
            mode_val = median_val
        
        return {
            'sum': round(total_sum, 2),
            'mean': round(mean_val, 2),
            'median': round(median_val, 2),
            'mode': round(mode_val, 2)
        }
    
    @staticmethod
    def frequency_distribution(data: List[str]) -> List[Dict[str, Any]]:
        """Generate frequency histogram for categorical data"""
        counter = Counter(data)
        total = len(data)
        
        return [
            {
                'category': item,
                'count': count,
                'percentage': round((count / total) * 100, 2) if total > 0 else 0
            }
            for item, count in counter.most_common()
        ]
    
    @staticmethod
    def vendor_aggregation(receipts: List[Dict]) -> List[Dict[str, Any]]:
        """Aggregate spending by vendor"""
        vendor_stats = defaultdict(lambda: {'count': 0, 'total': 0})
        
        for receipt in receipts:
            vendor = receipt.get('vendor', 'Unknown')
            amount = receipt.get('amount', 0) or 0
            
            vendor_stats[vendor]['count'] += 1
            vendor_stats[vendor]['total'] += float(amount)
        
        # Sort by total spending
        result = []
        for vendor, stats in vendor_stats.items():
            result.append({
                'vendor': vendor,
                'count': stats['count'],
                'total': round(stats['total'], 2),
                'average': round(stats['total'] / stats['count'], 2) if stats['count'] > 0 else 0
            })
        
        return sorted(result, key=lambda x: x['total'], reverse=True)
    
    @staticmethod
    def category_aggregation(receipts: List[Dict]) -> List[Dict[str, Any]]:
        """Aggregate spending by category"""
        category_stats = defaultdict(lambda: {'count': 0, 'amount': 0})
        
        for receipt in receipts:
            category = receipt.get('category', 'Uncategorized')
            amount = receipt.get('amount', 0) or 0
            
            category_stats[category]['count'] += 1
            category_stats[category]['amount'] += float(amount)
        
        result = []
        for category, stats in category_stats.items():
            result.append({
                'category': category,
                'count': stats['count'],
                'amount': round(stats['amount'], 2)
            })
        
        return sorted(result, key=lambda x: x['amount'], reverse=True)
    
    @staticmethod
    def time_series_aggregation(receipts: List[Dict]) -> List[Dict[str, Any]]:
        """Monthly spending aggregation with sliding windows"""
        monthly_stats = defaultdict(float)
        
        for receipt in receipts:
            date_str = receipt.get('date')
            amount = receipt.get('amount', 0) or 0
            
            if date_str:
                try:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                    month_key = date_obj.strftime('%Y-%m')
                    monthly_stats[month_key] += float(amount)
                except ValueError:
                    continue
        
        # Convert to list and sort by date
        result = []
        for month, amount in monthly_stats.items():
            try:
                date_obj = datetime.strptime(month, '%Y-%m')
                result.append({
                    'month': date_obj.strftime('%b %Y'),
                    'amount': round(amount, 2),
                    'date_sort': month
                })
            except ValueError:
                continue
        
        return sorted(result, key=lambda x: x['date_sort'])
    
    @staticmethod
    def moving_average(data: List[float], window_size: int = 3) -> List[float]:
        """Calculate moving average for trend analysis"""
        if len(data) < window_size:
            return data
        
        moving_averages = []
        for i in range(len(data) - window_size + 1):
            window = data[i:i + window_size]
            avg = sum(window) / window_size
            moving_averages.append(round(avg, 2))
        
        return moving_averages
    
    @staticmethod
    def calculate_trends(monthly_data: List[Dict]) -> Dict[str, Any]:
        """Calculate spending trends and growth rates"""
        if len(monthly_data) < 2:
            return {'trend': 'insufficient_data', 'growth_rate': 0}
        
        amounts = [item['amount'] for item in monthly_data]
        
        # Calculate simple trend
        first_half = amounts[:len(amounts)//2]
        second_half = amounts[len(amounts)//2:]
        
        first_avg = sum(first_half) / len(first_half) if first_half else 0
        second_avg = sum(second_half) / len(second_half) if second_half else 0
        
        growth_rate = ((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0
        
        trend = 'increasing' if growth_rate > 5 else 'decreasing' if growth_rate < -5 else 'stable'
        
        return {
            'trend': trend,
            'growth_rate': round(growth_rate, 2),
            'moving_average': AggregationAlgorithms.moving_average(amounts)
        }

class ComplexQueryEngine:
    """Advanced query engine combining search, sort, and aggregation"""
    
    def __init__(self):
        self.search = SearchAlgorithms()
        self.sort = SortingAlgorithms()
        self.aggregate = AggregationAlgorithms()
    
    def execute_query(self, data: List[Dict], filters: Dict, sort_options: Dict) -> Dict[str, Any]:
        """Execute complex query with filters, sorting, and aggregation"""
        # Apply filters
        filtered_data = data.copy()
        
        # Keyword search
        if filters.get('keyword'):
            search_fields = ['vendor', 'category', 'description', 'extracted_text']
            filtered_data = self.search.keyword_search(filtered_data, filters['keyword'], search_fields)
        
        # Vendor filter
        if filters.get('vendor'):
            filtered_data = [r for r in filtered_data if r.get('vendor', '').lower().find(filters['vendor'].lower()) != -1]
        
        # Category filter
        if filters.get('category'):
            filtered_data = [r for r in filtered_data if r.get('category') == filters['category']]
        
        # Date range filter
        if filters.get('date_from') or filters.get('date_to'):
            filtered_data = self.search.range_search(
                filtered_data, 'date', 
                filters.get('date_from'), 
                filters.get('date_to')
            )
        
        # Amount range filter
        if filters.get('amount_min') is not None or filters.get('amount_max') is not None:
            filtered_data = self.search.range_search(
                filtered_data, 'amount',
                filters.get('amount_min'),
                filters.get('amount_max')
            )
        
        # Apply sorting
        if sort_options.get('field'):
            field = sort_options['field']
            reverse = sort_options.get('direction', 'desc') == 'desc'
            
            def sort_key(item):
                value = item.get(field)
                if field == 'date' and value:
                    try:
                        return datetime.strptime(value, '%Y-%m-%d')
                    except ValueError:
                        return datetime.min
                return value or (float('-inf') if reverse else float('inf'))
            
            filtered_data = self.sort.timsort(filtered_data, sort_key, reverse)
        
        # Generate aggregated statistics
        amounts = [float(r.get('amount', 0) or 0) for r in filtered_data]
        stats = self.aggregate.calculate_basic_stats(amounts)
        
        return {
            'data': filtered_data,
            'count': len(filtered_data),
            'stats': stats,
            'vendor_stats': self.aggregate.vendor_aggregation(filtered_data),
            'category_stats': self.aggregate.category_aggregation(filtered_data),
            'monthly_stats': self.aggregate.time_series_aggregation(filtered_data)
        }