







# Setup development environment

Polynect leverages docker for easy setup and consistent results. Only docker is necessary. All of the following commands should run from the project directory root. 


#### Build images
	docker-compose create

#### Initial installation and build
	docker run -v "$(pwd):/app" -w "/app" node npm install


#### Watch for changes and compile 
	docker run -v "$(pwd):/app" -w "/app" node npm run watch


#### Run tests (in docker)
	npm run testd

or if you don't have npm

	docker-compose run -w /app --entrypoint 'node_modules/.bin/grunt test' web
 


# Misc

## Test matchmaking from the terminal

Run this in the terminal for an easy to use script

	echo "curl -XPOST -H \"Content-Type: application/json\" -H \"Authorization: Bearer 74a673672c943dab2e0cffd1083adfcc6bb6f20a7c4df0b2f47b9285e8a94228\" -d \$1 localhost:1235/v1/matches/match" > polynect

Now run this to start matchmaking 

	sh polynect {"game": "512798510250912f102", "player": {"id":"1"}}
	sh polynect {"game": "512798510250912f102", "player": {"id":"2"}}