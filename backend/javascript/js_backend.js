const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const app = express();

// Configure middleware with proper file handling
app.use(cors());
app.use(fileUpload({
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,  // Enable temp file mode
    tempFileDir: '/tmp/', // Set temp directory
    responseOnLimit: 'File size exceeds 2GB limit'
}));

const GPG_PATH = 'gpg';
// const GPG_PATH = "C:\\Program Files (x86)\\GnuPG\\bin\\gpg.exe";

app.post('/verify', async (req, res) => {
    let tempDir;
    try {
        tempDir = tmp.dirSync({ unsafeCleanup: true });
        console.log(`Processing in temp directory: ${tempDir.name}`);

        // Validate files exist
        if (!req.files?.public_key || !req.files?.signature_file || !req.files?.hash_file) {
            return res.status(400).json({ error: 'Missing required files' });
        }

        // File paths
        const filePaths = {
            pubKey: path.join(tempDir.name, 'public.key'),
            signature: path.join(tempDir.name, 'signature.sig'),
            hashFile: path.join(tempDir.name, 'hash.txt'),
            keyring: path.join(tempDir.name, 'keyring.gpg')
        };

        // Handle file uploads with proper streaming
        await Promise.all([
            req.files.public_key.mv(filePaths.pubKey),
            req.files.signature_file.mv(filePaths.signature),
            new Promise((resolve, reject) => {
                if (req.files.hash_file.tempFilePath) {
                    // File is already in temp storage
                    fs.copyFile(req.files.hash_file.tempFilePath, filePaths.hashFile, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                } else {
                    // File is in memory
                    fs.writeFile(filePaths.hashFile, req.files.hash_file.data, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            })
        ]);

        // GPG command execution helper (same as before)
        const runGpgCommand = (args) => new Promise((resolve, reject) => {
            const proc = spawn(GPG_PATH, args, { 
                cwd: tempDir.name,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data);
            proc.stderr.on('data', (data) => stderr += data);

            proc.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`GPG error: ${stderr}`));
                }
                resolve({ stdout, stderr });
            });
        });

        // Import key
        await runGpgCommand([
            '--no-default-keyring',
            '--keyring', filePaths.keyring,
            '--homedir', tempDir.name,
            '--import', filePaths.pubKey
        ]);

        // Verify signature
        const { stderr } = await runGpgCommand([
            '--no-default-keyring',
            '--keyring', filePaths.keyring,
            '--homedir', tempDir.name,
            '--verify', filePaths.signature, filePaths.hashFile
        ]);

        // Parse results
        const verified = stderr.includes('Good signature');
        const fingerprintLine = stderr.split('\n').find(line => 
            line.includes('Primary key fingerprint:')
        );
        const fingerprint = fingerprintLine 
            ? fingerprintLine.split(': ')[1].replace(/ /g, '')
            : null;

        res.json({
            verified,
            fingerprint,
            gpg_output: stderr
        });

    } catch (error) {
        console.error('Verification error:', error);
        const status = error.message.startsWith('GPG error') ? 400 : 500;
        res.status(status).json({ 
            error: error.message,
            details: error.stack 
        });
    } finally {
        if (tempDir) tempDir.removeCallback();
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});