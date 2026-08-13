package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/sezzle/calculator-backend/internal/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	handler := api.NewHandler()
	strictHandler := api.NewStrictHandler(handler, nil)

	r.Route("/api/v1", func(sub chi.Router) {
		api.HandlerFromMux(strictHandler, sub)
	})

	r.Get("/openapi.yaml", serveSpec)
	r.Get("/docs", serveDocs)

	log.Printf("calculator backend listening on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

func serveSpec(w http.ResponseWriter, r *http.Request) {
	spec, err := api.GetSwagger()
	if err != nil {
		http.Error(w, "failed to load spec", http.StatusInternalServerError)
		return
	}
	data, err := spec.MarshalJSON()
	if err != nil {
		http.Error(w, "failed to marshal spec", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(data)
}

const swaggerUIHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Calculator API Docs</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`

func serveDocs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	_, _ = w.Write([]byte(swaggerUIHTML))
}
