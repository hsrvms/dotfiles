# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection via interfaces**

Accept interfaces rather than creating concrete clients internally:

```go
// Easy to mock — caller controls the dependency
type PaymentClient interface {
	Charge(amount int) error
}

func ProcessPayment(order Order, client PaymentClient) error {
	return client.Charge(order.Total)
}

// Hard to mock — client created internally
func ProcessPayment(order Order) error {
	client := stripe.NewClient(os.Getenv("STRIPE_KEY"))
	return client.Charge(order.Total)
}
```

**2. Prefer narrow interfaces over generic fetchers**

Define one method per operation instead of one method with conditional logic:

```go
// GOOD: Each method is independently mockable
type UserAPI interface {
	GetUser(id string) (User, error)
	GetOrders(userID string) ([]Order, error)
	CreateOrder(data CreateOrderRequest) (Order, error)
}

// BAD: Mocking requires routing logic inside the mock
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}
```

The narrow-interface approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which operations a test exercises
- Compile-time safety per operation
