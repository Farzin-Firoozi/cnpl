package api

import (
	"context"
	"errors"

	"github.com/sezzle/calculator-backend/internal/calculator"
)

// CalculatorHandler implements StrictServerInterface, translating HTTP
// requests into calls against the pure calculator package and mapping
// domain errors to the appropriate response type.
type CalculatorHandler struct{}

func NewHandler() *CalculatorHandler {
	return &CalculatorHandler{}
}

func (h *CalculatorHandler) Add(_ context.Context, req AddRequestObject) (AddResponseObject, error) {
	result := calculator.Add(req.Body.A, req.Body.B)
	return Add200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Subtract(_ context.Context, req SubtractRequestObject) (SubtractResponseObject, error) {
	result := calculator.Subtract(req.Body.A, req.Body.B)
	return Subtract200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Multiply(_ context.Context, req MultiplyRequestObject) (MultiplyResponseObject, error) {
	result := calculator.Multiply(req.Body.A, req.Body.B)
	return Multiply200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Divide(_ context.Context, req DivideRequestObject) (DivideResponseObject, error) {
	result, err := calculator.Divide(req.Body.A, req.Body.B)
	if err != nil {
		if errors.Is(err, calculator.ErrDivideByZero) {
			return Divide422JSONResponse{Error: err.Error()}, nil
		}
		return nil, err
	}
	return Divide200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Power(_ context.Context, req PowerRequestObject) (PowerResponseObject, error) {
	result := calculator.Power(req.Body.Base, req.Body.Exponent)
	return Power200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Sqrt(_ context.Context, req SqrtRequestObject) (SqrtResponseObject, error) {
	result, err := calculator.Sqrt(req.Body.A)
	if err != nil {
		if errors.Is(err, calculator.ErrNegativeSqrt) {
			return Sqrt422JSONResponse{Error: err.Error()}, nil
		}
		return nil, err
	}
	return Sqrt200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) Percentage(_ context.Context, req PercentageRequestObject) (PercentageResponseObject, error) {
	result := calculator.Percentage(req.Body.A, req.Body.B)
	return Percentage200JSONResponse{ResultResponseJSONResponse{Result: result}}, nil
}

func (h *CalculatorHandler) HealthCheck(_ context.Context, _ HealthCheckRequestObject) (HealthCheckResponseObject, error) {
	return HealthCheck200JSONResponse{Status: "ok"}, nil
}
