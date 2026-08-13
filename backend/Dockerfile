FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /calculator-backend ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=build /calculator-backend /calculator-backend
EXPOSE 8080
ENTRYPOINT ["/calculator-backend"]
