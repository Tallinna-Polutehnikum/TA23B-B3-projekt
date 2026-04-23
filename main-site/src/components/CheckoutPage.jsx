import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./CheckoutPage.css";

const paymentOptions = [
  {
    id: "card",
    title: "Card payment",
    description: "Visa / MasterCard / MIR",
    accent: "#c084fc",
  },
  {
    id: "cash",
    title: "Pay at the cinema",
    description: "We’ll hold seats, pay at the box office",
    accent: "#fca5a5",
  },
];

const formatPrice = (value) => `${value.toFixed(2)} €`;

function StripeCardFields({ clientSecret, onReady }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements || !clientSecret) return undefined;

    const confirmPayment = () => stripe.confirmPayment({ elements, redirect: "if_required" });
    onReady?.(confirmPayment);

    return () => onReady?.(null);
  }, [stripe, elements, clientSecret, onReady]);

  return (
    <div className="checkout-card-element">
      <PaymentElement options={{ layout: "tabs" }} />
      <p className="checkout-inline-note">Use Stripe test card 4242 4242 4242 4242 with any future date and CVC.</p>
    </div>
  );
}

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
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [note, setNote] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [bookingError, setBookingError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);

  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isStripeClientConfigured = Boolean(stripePublishableKey);

  const stripePromise = useMemo(() => {
    return isStripeClientConfigured ? loadStripe(stripePublishableKey) : null;
  }, [isStripeClientConfigured, stripePublishableKey]);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripeInitError, setStripeInitError] = useState("");
  const [stripeInitLoading, setStripeInitLoading] = useState(false);
  const stripeConfirmRef = useRef(null);
  const handleStripeReady = useCallback((fn) => {
    stripeConfirmRef.current = fn;
  }, []);
  const [showStripeModal, setShowStripeModal] = useState(false);

  const cartIsEmpty = cart.length === 0;

  const seatsCount = useMemo(
    () => cart.filter((item) => item.type === "seats").reduce((acc, item) => acc + (item.seats?.length || 0), 0),
    [cart]
  );

  const giftCount = useMemo(
    () => cart.filter((item) => item.type === "gift").reduce((acc, item) => acc + (item.quantity || 0), 0),
    [cart]
  );

  useEffect(() => {
    if (paymentMethod !== "card") {
      setStripeClientSecret(null);
      setStripeInitError("");
      stripeConfirmRef.current = null;
      return;
    }

    if (cartIsEmpty || totalPrice <= 0) {
      setStripeClientSecret(null);
      setStripeInitError(cartIsEmpty ? "Cart is empty" : "Invalid total amount");
      return;
    }

    if (!stripePromise) {
      setStripeInitError("Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }

    let cancelled = false;
    const authToken = localStorage.getItem("ac_auth_token");

    const fetchIntent = async () => {
      setStripeInitLoading(true);
      setStripeInitError("");
      try {
        const response = await fetch("/api/payments/stripe/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            amount: totalPrice,
            currency: "EUR",
            cartItems: cart.length,
            seats: seatsCount,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !payload?.clientSecret) {
          throw new Error(payload?.message || "Failed to initialize Stripe payment");
        }
        setStripeClientSecret(payload.clientSecret);
        setPaymentInfo(null);
      } catch (err) {
        if (!cancelled) {
          setStripeInitError(err?.message || "Failed to set up Stripe payment");
          setStripeClientSecret(null);
        }
      } finally {
        if (!cancelled) setStripeInitLoading(false);
      }
    };

    fetchIntent();
    return () => {
      cancelled = true;
    };
  }, [paymentMethod, totalPrice, cart.length, seatsCount, stripePromise, cartIsEmpty]);

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

    setIsProcessing(true);
    setBookingError("");
    setStatus("idle");
    setPaymentInfo(null);

    try {
      if (paymentMethod === "card") {
        if (!stripePromise) {
          throw new Error("Stripe publishable key is missing on the client.");
        }
        if (!stripeClientSecret) {
          throw new Error("Preparing secure card form. Please try again in a moment.");
        }

        // Show modal with Stripe element; payment will be finalized there.
        setShowStripeModal(true);
        setIsProcessing(false);
        return;
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
          body: JSON.stringify({
            seatIds,
            userId: null,
            contactEmail: contact.email,
            contactName: contact.name,
          }),
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
            {stripeInitError && (
              <p className="checkout-inline-note checkout-inline-note--error">
                {stripeInitError}
              </p>
            )}
            {stripeInitLoading && (
              <p className="checkout-inline-note">Preparing secure card form...</p>
            )}
            {!stripeInitError && !stripeInitLoading && (
              <p className="checkout-inline-note">Card details will be requested in a secure popup after you click Pay.</p>
            )}
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
        aria-label="Decrease quantity"
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
      {showStripeModal && (
        <div className="checkout-modal">
          <div className="checkout-modal__dialog">
            <div className="checkout-modal__header">
              <h3>Secure card payment</h3>
              <button type="button" className="checkout-modal__close" onClick={() => setShowStripeModal(false)}>
                ×
              </button>
            </div>
            <div className="checkout-modal__body">
              {stripeInitError && (
                <p className="checkout-inline-note checkout-inline-note--error">{stripeInitError}</p>
              )}
              {stripeInitLoading && <p className="checkout-inline-note">Preparing secure card form...</p>}
              {stripePromise && stripeClientSecret && !stripeInitLoading && (
                <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                  <StripeCardFields clientSecret={stripeClientSecret} onReady={handleStripeReady} />
                </Elements>
              )}
            </div>
            <div className="checkout-modal__footer">
              <button
                type="button"
                className="checkout-submit"
                onClick={async () => {
                  setIsProcessing(true);
                  setBookingError("");
                  try {
                    if (!stripeConfirmRef.current) {
                      throw new Error("Card form is not ready. Please wait a moment.");
                    }
                    const stripeResult = await stripeConfirmRef.current();
                    if (stripeResult?.error) {
                      throw new Error(stripeResult.error.message || "Stripe confirmation failed.");
                    }

                    const paymentIntent = stripeResult?.paymentIntent;
                    if (!paymentIntent?.id) {
                      throw new Error("Stripe did not return a payment intent.");
                    }

                    const authToken = localStorage.getItem("ac_auth_token");
                    const syncResponse = await fetch("/api/payments/stripe/sync", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                      },
                      body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                    });

                    const syncPayload = await syncResponse.json().catch(() => null);
                    if (!syncResponse.ok) {
                      throw new Error(syncPayload?.message || "Failed to sync Stripe payment status.");
                    }

                    if (!["succeeded", "requires_capture"].includes(syncPayload?.status)) {
                      throw new Error(`Payment requires additional action (${syncPayload?.status || "unknown"}).`);
                    }

                    const seatItems = cart.filter((item) => item.type === "seats");
                    const authTokenForSeats = localStorage.getItem("ac_auth_token");
                    for (const item of seatItems) {
                      const seatIds = (item.seatIds || []).filter((id) => Number.isFinite(Number(id))).map(Number);
                      if (!item.sessionId || seatIds.length === 0 || seatIds.length !== (item.seats?.length || 0)) {
                        throw new Error("Some selected seats are missing booking metadata. Please reselect seats.");
                      }

                      const response = await fetch(`/api/sessions/${item.sessionId}/book`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(authTokenForSeats ? { Authorization: `Bearer ${authTokenForSeats}` } : {}),
                        },
                        body: JSON.stringify({
                          seatIds,
                          userId: null,
                          contactEmail: contact.email,
                          contactName: contact.name,
                        }),
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

                    setPaymentInfo(syncPayload);
                    onPaymentSuccess?.();
                    setStatus("success");
                    setShowStripeModal(false);
                  } catch (error) {
                    console.error("Checkout booking error", error);
                    setStatus("error");
                    setBookingError(error?.message || "Unable to complete booking.");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing || stripeInitLoading || !!stripeInitError}
              >
                {isProcessing ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
              </button>
              <button type="button" className="checkout-link" onClick={() => setShowStripeModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <div className={`checkout-payments__dot checkout-payments__dot--${option.id}`} />
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

            <div className="checkout-actions">
              <button
                type="submit"
                className="checkout-submit"
                disabled={!acceptedTerms || cartIsEmpty || isProcessing || !paymentMethod || status === "success" || !contact.email}
              >
                {isProcessing ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
              </button>
              <p className="checkout-disclaimer">
                By clicking “Pay”, you reserve seats and receive e-tickets by email and in your profile.
              </p>
              {status === "error" && (
                <p className="checkout-disclaimer checkout-disclaimer--error">
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
                {(paymentInfo?.paymentId || paymentInfo?.paymentIntentId) && (
                  <p className="checkout-success__text">
                    Payment ID: {paymentInfo.paymentId || paymentInfo.paymentIntentId}
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
                          ? `${item.title || "Session"}${item.time ? ` · ${item.time}` : ""}`
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
                        aria-label="Remove from cart"
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
