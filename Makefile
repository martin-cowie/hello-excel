all: manifest.xml dist/functions.json compile

manifest.xml: manifest-localhost.xml
	sed 's|http://localhost:3011|https://martin-cowie.github.io/hello-excel|g' $< > $@

dist/functions.json: src/functions.json
	cp $< $@

compile:
	npx tsc