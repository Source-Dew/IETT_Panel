import sys
import json
import argparse
from method2 import logic as method2_logic

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', action='append', help='Path to the Excel file(s)')
    parser.add_argument('--file1', help='Path to the first Excel file')
    parser.add_argument('--file2', help='Path to the second Excel file')
    parser.add_argument('--mode', help='Operation mode')
    parser.add_argument('--threshold', help='Threshold value')
    parser.add_argument('--cars2', type=str, help='Method 2 Cars 2 Door list')
    parser.add_argument('--cars3', type=str, help='Method 2 Cars 3 Door list')
    parser.add_argument('--detailed_cars', type=str, help='Method 2 Detailed Analysis list')
    parser.add_argument('--is_detailed', action='store_true', help='Enable detailed analysis')
    parser.add_argument('--config', type=str, help='Config file path')
    parser.add_argument('--input_file', type=str, help='JSON file containing all arguments')
    
    args_namespace = parser.parse_args()
    args = vars(args_namespace)
    
    # If a JSON input file is provided, load its contents and update the args dictionary
    if args.get('input_file'):
        try:
            with open(args['input_file'], 'r', encoding='utf-8') as f:
                json_args = json.load(f)
                
                # Merge logic
                if isinstance(json_args, dict):
                    # Handle structured object format
                    if 'files' in json_args: args['file'] = json_args['files']
                    if 'mode' in json_args: args['mode'] = json_args['mode']
                    if 'cars2' in json_args: args['cars2'] = json_args['cars2']
                    if 'cars3' in json_args: args['cars3'] = json_args['cars3']
                    if 'detailed_cars' in json_args: args['detailed_cars'] = json_args['detailed_cars']
                    if 'is_detailed' in json_args: args['is_detailed'] = json_args['is_detailed']
                elif isinstance(json_args, list):
                    # Handle legacy flat array format
                    # Strip 'process' command if it's there
                    raw_args = json_args[1:] if json_args and json_args[0] == 'process' else json_args
                    # Parse the list items through argparse again
                    # Using parse_known_args to ignore legacy flags like --method
                    new_args, _ = parser.parse_known_args(raw_args)
                    args.update(vars(new_args))
        except Exception as e:
            print(json.dumps({"type": "error", "data": {"message": f"Failed to load input file: {str(e)}"}}))
            sys.exit(1)
    
    method2_logic.run(args)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"type": "error", "data": {"message": str(e)}}))
        sys.exit(1)
