# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```go
// GOOD: Tests observable behavior
func TestUserCanCheckoutWithValidCart(t *testing.T) {
	cart := NewCart()
	cart.Add(product)
	result, err := Checkout(cart, paymentMethod)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Status != StatusConfirmed {
		t.Errorf("got status %v, want %v", result.Status, StatusConfirmed)
	}
}
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```go
// BAD: Tests implementation details
func TestCheckoutCallsPaymentServiceProcess(t *testing.T) {
	mockPayment := &MockPaymentService{}
	Checkout(cart, mockPayment)
	if !mockPayment.ProcessCalledWith(cart.Total) {
		t.Error("expected Process to be called with cart total")
	}
}
```

Red flags:

- Mocking internal collaborators
- Testing unexported methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```go
// BAD: Bypasses interface to verify
func TestCreateUserSavesToDatabase(t *testing.T) {
	CreateUser(User{Name: "Alice"})
	row := db.QueryRow("SELECT * FROM users WHERE name = ?", "Alice")
	if err := row.Scan(...); err != nil {
		t.Fatal("user not found in database")
	}
}

// GOOD: Verifies through interface
func TestCreateUserMakesUserRetrievable(t *testing.T) {
	user, _ := CreateUser(User{Name: "Alice"})
	retrieved, err := GetUser(user.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if retrieved.Name != "Alice" {
		t.Errorf("got name %q, want %q", retrieved.Name, "Alice")
	}
}
```

**Tautological tests**: Expected value restates the implementation, so the test passes by construction.

```go
// BAD: Expected value is recomputed the way the code computes it
func TestCalculateTotalSumsLineItems(t *testing.T) {
	items := []LineItem{{Price: 10}, {Price: 5}}
	var expected int
	for _, i := range items {
		expected += i.Price
	}
	if got := CalculateTotal(items); got != expected {
		t.Errorf("got %d, want %d", got, expected)
	}
}

// GOOD: Expected value is an independent, known literal
func TestCalculateTotalSumsLineItems(t *testing.T) {
	got := CalculateTotal([]LineItem{{Price: 10}, {Price: 5}})
	if got != 15 {
		t.Errorf("got %d, want %d", got, 15)
	}
}
```
