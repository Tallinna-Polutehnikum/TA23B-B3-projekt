import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./CheckoutPage.css";

const paymentOptions = [
  {
    id: "montonio",
    title: "Montonio (test)",
    description: "Mock bank-link payment flow",
    accent: "#f9a8d4",
  },
  {
    id: "card",
    title: "Card payment",
    description: "Visa / MasterCard / MIR",
    accent: "#c084fc",
  },
  {
    id: "applepay",
    title: "Apple Pay",
    description: "Fast checkout with Face ID",
    accent: "#fef08a",
  },
  {
    id: "googlepay",
    title: "Google Pay",
    description: "One-tap checkout",
    accent: "#7dd3fc",
  },
  {
    id: "cash",
    title: "Pay at the cinema",
    description: "We’ll hold seats, pay at the box office",
    accent: "#fca5a5",
  },
];

const formatPrice = (value) => `${value.toFixed(2)} €`;

const paymentProviderByMethod = {
  montonio: "montonio",
  card: null,
  applepay: null,
  googlepay: null,
  cash: null,
};

export default function CheckoutPage({
  cart,
  totalPrice,
  onRemoveFromCart,
  onUpdateQuantity,
  onRemoveSeat,
  onPaymentSuccess,
  onBack,
  onNavigateHome,
  onComplete,
}) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "", holder: "" });
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [note, setNote] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [bookingError, setBookingError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);

  const cartIsEmpty = cart.length === 0;

  const seatsCount = useMemo(
    () => cart.filter((item) => item.type === "seats").reduce((acc, item) => acc + (item.seats?.length || 0), 0),
    [cart]
  );

  const giftCount = useMemo(
    () => cart.filter((item) => item.type === "gift").reduce((acc, item) => acc + (item.quantity || 0), 0),
    [cart]
  );

  const handleFieldChange = (key, value) => {
    setContact((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectPayment = (id) => {
    setPaymentMethod(id);
    setShowPaymentDetails(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (cartIsEmpty || isProcessing || !paymentMethod) return;

    const seatItems = cart.filter((item) => item.type === "seats");
    const authToken = localStorage.getItem("ac_auth_token");
    const provider = paymentProviderByMethod[paymentMethod] ?? null;

    setIsProcessing(true);
    setBookingError("");
    setStatus("idle");
    setPaymentInfo(null);

    try {
      if (provider) {
        const intentResponse = await fetch("/api/payments/mock-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            provider,
            amount: totalPrice,
            currency: "EUR",
            method: paymentMethod,
            metadata: {
              seatItems: seatItems.length,
              cartItems: cart.length,
            },
          }),
        });

        const intentPayload = await intentResponse.json().catch(() => null);
        if (!intentResponse.ok || !intentPayload?.paymentId) {
          throw new Error(intentPayload?.message || "Failed to initialize mock payment.");
        }

        const confirmResponse = await fetch("/api/payments/mock-confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            provider,
            paymentId: intentPayload.paymentId,
          }),
        });

        const confirmPayload = await confirmResponse.json().catch(() => null);
        if (!confirmResponse.ok || confirmPayload?.status !== "succeeded") {
          throw new Error(confirmPayload?.message || "Mock payment was not approved.");
        }

        setPaymentInfo(confirmPayload);
      }

      for (const item of seatItems) {
        const seatIds = (item.seatIds || []).filter((id) => Number.isFinite(Number(id))).map(Number);
        if (!item.sessionId || seatIds.length === 0 || seatIds.length !== (item.seats?.length || 0)) {
          throw new Error("Some selected seats are missing booking metadata. Please reselect seats.");
        }

        const response = await fetch(`/api/sessions/${item.sessionId}/book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ seatIds, userId: null }),
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(payload?.message || "Failed to reserve seats. Please try again.");
        }
      }

      onPaymentSuccess?.();
      setIsProcessing(false);
      setStatus("success");
    } catch (error) {
      console.error("Checkout booking error", error);
      setIsProcessing(false);
      setStatus("error");
      setBookingError(error?.message || "Unable to complete booking.");
    }
  };

  const renderPaymentDetails = () => {
    if (!paymentMethod) return null;
    const option = paymentOptions.find((opt) => opt.id === paymentMethod);

    const header = (
      <div className="checkout-payment-active__header">
        <div>
          <p className="checkout-panel__eyebrow">Selected method</p>
          <h3 className="checkout-payment-active__title">{option?.title}</h3>
          <p className="checkout-payment-active__desc">{option?.description}</p>
        </div>
        <button type="button" className="checkout-link" onClick={() => setShowPaymentDetails(false)}>
          Change method
        </button>
      </div>
    );

    if (paymentMethod === "card") {
      return (
        <div className="checkout-payment-active">
          {header}
          <div className="checkout-payment-form">
            <div className="checkout-field">
              <label htmlFor="card-holder">Name on card</label>
              <input
                id="card-holder"
                value={cardData.holder}
                onChange={(e) => setCardData({ ...cardData, holder: e.target.value })}
                placeholder="IVAN IVANOV"
                required
              />
            </div>
            <div className="checkout-card-grid">
              <div className="checkout-field">
                <label htmlFor="card-number">Card number</label>
                <input
                  id="card-number"
                  inputMode="numeric"
                  maxLength={23}
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="card-expiry">Expiry</label>
                <input
                  id="card-expiry"
                  inputMode="numeric"
                  maxLength={7}
                  value={cardData.expiry}
                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="card-cvc">CVC</label>
                <input
                  id="card-cvc"
                  inputMode="numeric"
                  maxLength={4}
                  value={cardData.cvc}
                  onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                  placeholder="123"
                  required
                />
              </div>
            </div>
            <p className="checkout-inline-note">Data is encrypted, your bank will prompt for 3‑D Secure.</p>
          </div>
        </div>
      );
    }

    if (paymentMethod === "cash") {
      return (
        <div className="checkout-payment-active">
          {header}
          <div className="checkout-payment-form checkout-payment-form--compact">
            <p className="checkout-inline-note">
              We will hold your seats. Pay at the cinema box office at least 30 minutes before the show.
            </p>
          </div>
        </div>
      );
    }

    if (paymentMethod === "montonio") {
      return (
        <div className="checkout-payment-active">
          {header}
          <div className="checkout-payment-form checkout-payment-form--compact">
            <p className="checkout-inline-note">
              This project uses a mock integration. No real money is charged. On submit, a simulated {option?.title}
              payment is created and confirmed.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="checkout-payment-active">
        {header}
        <div className="checkout-payment-form checkout-payment-form--compact">
          <p className="checkout-inline-note">
            Confirm the payment in your wallet. We will send a push notification and an email with tickets.
          </p>
          <button type="button" className="checkout-submit checkout-submit--ghost">
            Open {option?.title}
          </button>
        </div>
      </div>
    );
  };

  const renderItemSeats = (item) => (
    <div className="checkout-seats">
      <div className="checkout-seats__label">Seats</div>
      <div className="checkout-seats__list">
        {item.seats?.map((seatLabel) => (
          <span key={seatLabel} className="checkout-chip">
            {seatLabel}
            <button
              type="button"
              className="checkout-chip__remove"
              onClick={() => onRemoveSeat?.(item.id, seatLabel)}
              aria-label={`Remove seat ${seatLabel}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="checkout-seats__meta">€{item.price} per seat</div>
    </div>
  );

  const renderItemQuantity = (item) => (
    <div className="checkout-qty">
      <button
        type="button"
        onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
        className="checkout-qty__btn"
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className="checkout-qty__value">{item.quantity}</span>
      <button
        type="button"
        onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
        className="checkout-qty__btn"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  return (
    <section className="checkout-page">
      <header className="checkout-page__hero">
        <div>
          <p className="checkout-page__eyebrow">Booking & payment</p>
          <h1 className="checkout-page__title">Review your cart and choose payment</h1>
          <p className="checkout-page__subtitle">
            Double-check your seats, gift cards, and contact info for e-tickets.
          </p>
        </div>
        <div className="checkout-page__pill">Secure payment</div>
      </header>

      <div className="checkout-grid">
        <div className="checkout-panel checkout-panel--primary">
          <div className="checkout-panel__heading">
            <div>
              <p className="checkout-panel__eyebrow">Payment method</p>
              <h2 className="checkout-panel__title">Pick what works for you</h2>
            </div>
            <button type="button" className="checkout-link" onClick={onBack}>
              Back
            </button>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            {!showPaymentDetails ? (
              <div className="checkout-payments">
                {paymentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`checkout-payments__option ${paymentMethod === option.id ? "is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.id}
                      checked={paymentMethod === option.id}
                      onChange={() => handleSelectPayment(option.id)}
                    />
                    <div className="checkout-payments__dot" style={{ background: option.accent }} />
                    <div className="checkout-payments__meta">
                      <div className="checkout-payments__title">{option.title}</div>
                      <div className="checkout-payments__desc">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              renderPaymentDetails()
            )}

            <div className="checkout-form__fields">
              <div className="checkout-field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  value={contact.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="As in passport"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="email">Email for tickets</label>
                <input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="phone">Phone for notifications</label>
                <input
                  id="phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="+372 5555 1234"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="note">Order notes</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g., send invoices to company"
                  rows={3}
                />
              </div>
              <label className="checkout-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  I accept the ticket refund policy and visit rules of Absolute Cinema
                </span>
              </label>
            </div>

            <div className="checkout-actions">
              <button
                type="submit"
                className="checkout-submit"
                disabled={!acceptedTerms || cartIsEmpty || isProcessing || !paymentMethod || status === "success"}
              >
                {isProcessing ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
              </button>
              <p className="checkout-disclaimer">
                By clicking “Pay”, you reserve seats and receive e-tickets by email and in your profile.
              </p>
              {status === "error" && (
                <p className="checkout-disclaimer" style={{ color: "#fca5a5" }}>
                  {bookingError}
                </p>
              )}
            </div>

            {status === "success" && (
              <div className="checkout-success">
                <div className="checkout-success__title">Payment confirmed</div>
                <p className="checkout-success__text">
                  We sent tickets to {contact.email || "your email"}. Receipt is available in your profile.
                </p>
                {paymentInfo?.paymentId && (
                  <p className="checkout-success__text">
                    Mock payment ID: {paymentInfo.paymentId}
                  </p>
                )}
                <div className="checkout-success__actions">
                  <button type="button" className="checkout-link" onClick={onNavigateHome}>
                    Back to home
                  </button>
                  <button type="button" className="checkout-submit" onClick={onComplete}>
                    Continue browsing
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <aside className="checkout-panel checkout-panel--summary">
          <div className="checkout-panel__heading">
            <div>
              <p className="checkout-panel__eyebrow">Cart</p>
              <h2 className="checkout-panel__title">Your selection</h2>
            </div>
            <div className="checkout-badges">
              <span className="checkout-badge">{seatsCount} seats</span>
              <span className="checkout-badge">{giftCount} gifts</span>
            </div>
          </div>

          {cartIsEmpty ? (
            <div className="checkout-empty">
              <p>Your cart is empty. Return to the schedule to pick a showtime or gift card.</p>
              <Link className="checkout-link" to="/showtime">Browse showtimes</Link>
            </div>
          ) : (
            <div className="checkout-list">
              {cart.map((item) => {
                const isSeatItem = item.type === "seats";
                return (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item__meta">
                      <div className="checkout-item__title">
                        {isSeatItem
                          ? `${item.title || "Сеанс"}${item.time ? ` · ${item.time}` : ""}`
                          : item.name}
                      </div>
                      {isSeatItem && item.cinema && (
                        <div className="checkout-item__cinema">{item.cinema}</div>
                      )}
                      {isSeatItem ? (
                        renderItemSeats(item)
                      ) : (
                        <div className="checkout-item__note">{item.price} € each</div>
                      )}
                    </div>

                    <div className="checkout-item__controls">
                      {isSeatItem ? (
                        <div className="checkout-item__qty">× {item.quantity}</div>
                      ) : (
                        renderItemQuantity(item)
                      )}
                      <div className="checkout-item__price">{formatPrice(item.price * item.quantity)}</div>
                      <button
                        type="button"
                        className="checkout-remove"
                        onClick={() => onRemoveFromCart?.(item.id)}
                        aria-label="Удалить из корзины"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="checkout-totals">
            <div className="checkout-totals__row">
                <span>Total</span>
              <span className="checkout-totals__value">{formatPrice(totalPrice)}</span>
            </div>
              <p className="checkout-totals__hint">No online payment fee. VAT included.</p>
            <div className="checkout-actions--inline">
              <button type="button" className="checkout-link" onClick={() => onNavigateHome?.()}>
                  Keep browsing
              </button>
              {!cartIsEmpty && (
                <button type="button" className="checkout-submit" onClick={() => onBack?.()}>
                  Edit cart
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
