# flask_verify_sig.py
from flask import Flask, request, jsonify
import subprocess
import os
import logging
import tempfile
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)
GPG_PATH = 'gpg'  # Make sure this is in your $PATH

@app.route('/verify', methods=['POST'])
def verify_files():
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            app.logger.debug(f"Processing in temp directory: {temp_dir}")
            
            # Save uploaded files
            pub_key = os.path.join(temp_dir, 'public.key')
            hash_file = os.path.join(temp_dir, 'hash.txt')
            signature = os.path.join(temp_dir, 'signature.sig')
            
            request.files['public_key'].save(pub_key)
            request.files['signature_file'].save(signature)
            
            with open(hash_file, 'wb') as f:
                while True:
                    chunk = request.files['hash_file'].read(4096)
                    if not chunk: break
                    f.write(chunk)

            # GPG operations
            keyring = os.path.join(temp_dir, 'keyring.gpg')
            
            # Import key
            subprocess.run([
                GPG_PATH, '--no-default-keyring',
                '--keyring', keyring,
                '--homedir', temp_dir,
                '--import', pub_key
            ], check=True)

            # Verify signature
            result = subprocess.run([
                GPG_PATH, '--no-default-keyring',
                '--keyring', keyring,
                '--homedir', temp_dir,
                '--verify', signature, hash_file
            ], capture_output=True, text=True)

            # Parse output
            verified = 'Good signature' in result.stderr
            fingerprint = next((line.split(': ')[-1].replace(' ', '') 
                              for line in result.stderr.split('\n')
                              if 'Primary key fingerprint:' in line), None)

            return jsonify({
                'verified': verified,
                'fingerprint': fingerprint,
                'gpg_output': result.stderr
            })

    except subprocess.CalledProcessError as e:
        app.logger.error(f"GPG error: {e.stderr}")
        return jsonify({'error': 'Verification failed', 'details': e.stderr}), 500
    except Exception as e:
        app.logger.error(f"Server error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)