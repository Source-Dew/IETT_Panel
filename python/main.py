import sys
import json
import argparse
from method1 import logic as method1_logic
from method2 import logic as method2_logic

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', nargs='?')
    parser.add_argument('--file', help='Path to the Excel file')
    parser.add_argument('--file1', help='Path to the first Excel file')
    parser.add_argument('--file2', help='Path to the second Excel file')
    parser.add_argument('--mode', help='Operation mode')
    parser.add_argument('--method', type=int, default=1, help='1 or 2')
    parser.add_argument('--threshold', help='Threshold value')
    parser.add_argument('--config', help='Path to config.json')
    
    args = vars(parser.parse_args())
    
    if args['method'] == 2:
        method2_logic.run(args)
    else:
        method1_logic.run(args)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"type": "error", "data": {"message": str(e)}}))
        sys.exit(1)
