from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'environment.json')

def load_base_data():
    with open(DATA_PATH, encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/environment')
def get_environment():
    return jsonify(load_base_data())

@app.route('/api/environment/<region_id>')
def get_region(region_id):
    data = load_base_data()
    for sido, info in data.items():
        if info['id'] == region_id:
            # UI 코드가 수정되기 전까지 에러 방지를 위해 빈 값으로 안전하게 제공합니다.
            info["analysis"] = []
            info["solutions"] = []
            return jsonify(info)
            
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)