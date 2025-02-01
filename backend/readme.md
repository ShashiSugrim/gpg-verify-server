so to restart you need to stop nginx and then start it again


### to build dockerfile:
docker build -t flask-gpg-verifier .


### to run dockerfile
docker run -p 5001:5001 flask-gpg-verifier
