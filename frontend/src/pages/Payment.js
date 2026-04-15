import React, { useMemo, useRef, useState } from 'react';
import { buildApiUrl } from '../utils/api';
import '../styles/Payment.css';

const BOOKING_STORAGE_KEY = 'bookmyseat_currentBooking';
const SEAT_SELECTION_STORAGE_KEY = 'bookmyseat_selectedSeats';
const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_SbiSdl0tXVdjyx';

const Payment = ({ booking, user, onPaymentSuccess, onEditSeats, menuItems = [] }) => {
    const [activeMethod, setActiveMethod] = useState('UPI');
    const [isPaid, setIsPaid] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusCard, setStatusCard] = useState({ text: '', type: '' });
    const redirectTimerRef = useRef(null);

    const persistedBooking = useMemo(() => {
        try {
            const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const currentBooking = booking || persistedBooking;
    const selectedSeats = currentBooking?.seats || [];
    const totalPrice = currentBooking?.totalPrice || selectedSeats.length * 150;
    const greetingName = user?.name || user?.displayName || 'User';
    const activeUserId = user?._id || user?.id || user?.uid;

    const showStatus = (text, type = 'error') => {
        setStatusCard({ text, type });
    };

    const showSafeError = (context = 'general') => {
        const messageByContext = {
            order: 'Unable to start payment right now. Please try again.',
            verify: 'Payment verification failed. Please try again.',
            booking: 'Payment received, but booking confirmation failed. Please check Payment History.',
            gateway: 'Unable to open payment gateway. Refresh and try again.',
            failed: 'Payment failed. Please try again.',
            general: 'Something went wrong. Please try again.'
        };
        setStatusCard({ text: messageByContext[context] || messageByContext.general, type: 'error' });
    };

    const recordPaymentResult = async ({ status, transactionId, details = {}, bookingId = null }) => {
        if (!activeUserId) return;

        await fetch(buildApiUrl('/api/payments/record'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: activeUserId,
                bookingId,
                method: activeMethod,
                status,
                amount: totalPrice,
                transactionId,
                details,
                bookingSnapshot: currentBooking,
                email: user?.email
            })
        });
    };

    const handleEditSeats = () => {
        localStorage.setItem(SEAT_SELECTION_STORAGE_KEY, JSON.stringify(selectedSeats));
        if (typeof onEditSeats === 'function') {
            onEditSeats();
            return;
        }
        window.history.back();
    };

    // --- NEW RAZORPAY PAYMENT LOGIC ---
    const handlePayment = async () => {
        setStatusCard({ text: '', type: '' });

        if (!currentBooking || selectedSeats.length === 0) {
            showStatus('Please select at least one seat before payment.', 'warning');
            return;
        }

        if (!window.Razorpay) {
            showStatus('Razorpay SDK failed to load. Refresh the page and try again.', 'error');
            return;
        }

        if (!RAZORPAY_KEY_ID) {
            showStatus('Missing Razorpay key configuration.', 'error');
            return;
        }

        if (!activeUserId) {
            showStatus('Please login again to continue payment.', 'warning');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order on Backend (Node.js)
            const response = await fetch(buildApiUrl('/api/payments/create-order'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: totalPrice }), 
            });
            
            if (!response.ok) {
                throw new Error('ORDER_CREATION_FAILED');
            }
            const order = await response.json();

            // 2. Configure Razorpay Options
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "BookMySeat AI",
                description: `Tickets for ${currentBooking?.movieName}`,
                order_id: order.id,
                handler: async function (paymentResponse) {
                    try {
                        // 3. Verify Payment Signature on Backend
                        const verifyRes = await fetch(buildApiUrl('/api/payments/verify'), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(paymentResponse),
                        });

                        if (!verifyRes.ok) {
                            throw new Error('VERIFY_FAILED');
                        }

                        const verifyData = await verifyRes.json();

                        if (verifyData.message !== "Payment verified successfully") {
                            throw new Error('VERIFY_FAILED');
                        }

                        // 4. Save booking if possible, but always record payment success.
                        let bookingId = null;
                        let bookingError = null;
                        try {
                            const bookingRes = await fetch(buildApiUrl('/api/bookings/book'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...currentBooking,
                                    userId: activeUserId,
                                    userEmail: user?.email,
                                    paymentId: paymentResponse.razorpay_payment_id,
                                    paymentStatus: 'completed',
                                    status: 'active'
                                })
                            });

                            if (bookingRes.ok) {
                                const bookingPayload = await bookingRes.json();
                                bookingId = bookingPayload?.booking?._id || null;
                            } else {
                                bookingError = 'BOOKING_FAILED';
                            }
                        } catch {
                            bookingError = 'BOOKING_FAILED';
                        }

                        await recordPaymentResult({
                            status: 'successful',
                            transactionId: paymentResponse.razorpay_payment_id,
                            bookingId,
                            details: {
                                ...paymentResponse,
                                bookingError,
                            }
                        });

                        localStorage.removeItem(SEAT_SELECTION_STORAGE_KEY);
                        localStorage.removeItem(BOOKING_STORAGE_KEY);
                        setIsPaid(true);
                        showStatus('Payment Successful 🎉', 'success');

                        if (redirectTimerRef.current) {
                            clearTimeout(redirectTimerRef.current);
                        }
                        redirectTimerRef.current = setTimeout(() => {
                            if (onPaymentSuccess) {
                                onPaymentSuccess({
                                    paymentId: paymentResponse.razorpay_payment_id,
                                    bookingId,
                                    status: 'successful'
                                });
                            }
                        }, 2500);
                    } catch (error) {
                        if (error?.message === 'VERIFY_FAILED') {
                            showSafeError('verify');
                        } else {
                            showSafeError('general');
                        }
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: greetingName,
                    email: user?.email || "deenreshwa@gmail.com",
                },
                method: activeMethod === 'UPI'
                    ? { upi: true }
                    : activeMethod === 'Card'
                    ? { card: true }
                    : activeMethod === 'NetBanking'
                    ? { netbanking: true }
                    : undefined,
                config: activeMethod === 'UPI'
                    ? {
                        display: {
                            blocks: {
                                upi: {
                                    name: 'Pay using UPI',
                                    instruments: [{ method: 'upi' }],
                                },
                            },
                            sequence: ['block.upi'],
                            preferences: {
                                show_default_blocks: true,
                            },
                        },
                    }
                    : undefined,
                theme: { color: "#782828" }, // Deep Red Cinema Theme
            };

            // 5. Open the Razorpay Modal
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', async function (response) {
                const transactionId =
                    response?.error?.metadata?.payment_id ||
                    response?.error?.metadata?.order_id ||
                    `failed-${Date.now()}`;

                await recordPaymentResult({
                    status: 'failed',
                    transactionId,
                    details: response?.error || {}
                });

                showSafeError('failed');
                setIsProcessing(false);
            });
            rzp.open();
            setIsProcessing(false);

        } catch (error) {
            if (error?.message === 'ORDER_CREATION_FAILED') {
                showSafeError('order');
            } else {
                showSafeError('gateway');
            }
            if (error?.message) {
                await recordPaymentResult({
                    status: 'failed',
                    transactionId: `init-failed-${Date.now()}`,
                    details: { message: error.message }
                });
            }
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-page-wrapper">
            <nav className="minimal-nav">
                <div className="brand">BookMySeat <span>AI</span></div>
                <div className="payment-nav-title"><h2>Secure Payment</h2></div>
                <div className="nav-right-section">
                    <span className="payment-user-greeting">Hi, {greetingName}</span>
                    <div className="hamburger-container">
                        <div className="hamburger" onClick={() => setIsMenuOpen((prev) => !prev)} role="button" tabIndex={0} aria-label="Open menu">
                            ☰
                        </div>
                        {isMenuOpen && (
                            <div className="dropdown-menu">
                                <button className="dropdown-close-btn" onClick={() => setIsMenuOpen(false)}>×</button>
                                {menuItems.map((item) => (
                                    <a key={item.key} href={`#${item.key}`} onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); item.onClick(); }}>
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            
            <div className="payment-main-card">
                <div className="method-selector">
                    <h2>Choose Payment Method</h2>
                    {['UPI', 'Card', 'NetBanking', 'Voucher'].map(method => (
                        <div key={method} className={`selector-item ${activeMethod === method ? 'active' : ''}`} onClick={() => setActiveMethod(method)}>
                            <span className="icon">{method === 'UPI' ? '📱' : method === 'Card' ? '💳' : method === 'NetBanking' ? '🏦' : '🎁'}</span> 
                            {method === 'UPI' ? 'Pay by any UPI App' : method === 'Card' ? 'Debit/ Credit Card' : method === 'NetBanking' ? 'Net Banking' : 'Gift Voucher'}
                        </div>
                    ))}
                </div>

                <div className="input-details">
                    {statusCard.text && (
                        <div className={`payment-status-card ${statusCard.type || 'info'}`}>
                            {statusCard.text}
                        </div>
                    )}

                    {!isPaid ? (
                        <div className="method-view">
                            <h3>{activeMethod} Payment</h3>
                            <p className="hint-text">{activeMethod === 'UPI' ? 'Scan to pay securely via Razorpay' : 'Secure payment gateway'}</p>
                            
                            {activeMethod === 'UPI' && (
                                <div className="qr-placeholder">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Razorpay" alt="Gateway Logo" />
                                </div>
                            )}

                            {activeMethod === 'Card' && (
                                <div className="card-placeholder-text">Securely enter card details in the next step.</div>
                            )}

                            <button className="pay-btn" onClick={handlePayment} disabled={isProcessing}>
                                {isProcessing ? 'Initializing...' : `PAY ₹${Number(totalPrice).toFixed(0)}`}
                            </button>
                        </div>
                    ) : (
                        <div className="success-view">
                            <div className="success-icon">✓</div>
                            <h3>Payment Successful 🎉</h3>
                            <p>Your receipt has been generated.</p>
                            <p>Check your email or go to Profile → Payment History to download it.</p>
                            <p>Redirecting...</p>
                        </div>
                    )}
                </div>

                <div className="order-summary-box">
                    <h3>Summary</h3>
                    <div className="movie-summary-card">
                        <div className="summary-header">
                            <strong>{currentBooking?.movieName || 'Movie'}</strong>
                            <span className="edit-link" onClick={handleEditSeats}>Edit Seats</span>
                        </div>
                        <p>{currentBooking?.showDate} | {currentBooking?.showTime}</p>
                        <p>Seats: {selectedSeats.join(', ')}</p>
                    </div>

                    <div className="price-breakdown">
                        <div className="price-row"><span>Total Price</span><span>₹{Number(totalPrice).toFixed(2)}</span></div>
                        <div className="price-row total"><span>Order Total</span><span>₹{Number(totalPrice).toFixed(2)}</span></div>
                    </div>
                    <div className="payable-badge">Amount Payable: ₹{Number(totalPrice).toFixed(0)} /-</div>
                </div>
            </div>
            
        </div>
    );
};

export default Payment;