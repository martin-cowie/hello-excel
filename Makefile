manifest.xml: manifest-localhost.xml
	sed 's|https://localhost:3000|https://martin-cowie.github.io/hello-excel|g' $< > $@