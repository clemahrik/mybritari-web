import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/Toast';
import { paymentsAPI } from '../../services/api';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState('verifying'); // verifying | success | pending | failed

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      setStatus('failed');
      return;
    }

    paymentsAPI.verifyPaystack(reference)
      .then(res => {
        if (res.data?.success === true) {
          setStatus('success');
          showToast('Payment successful!', 'success');
          setTimeout(() => navigate('/contracts'), 2500);
        } else {
          setStatus('failed');
        }
      })
      .catch(e => {
        // Paystack pending = payment still processing (common with USSD/bank transfers)
        // Backend intentionally returns 400 for pending so we don't wrongly mark success.
        const serverStatus = e?.response?.data?.data?.status;
        if (serverStatus === 'pending') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }
      });
  }, []);

  return (
    <Layout>
      <TopHeader title="Payment" showBack />
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        {status === 'verifying' && (
          <>
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-textsub font-700">Verifying your payment…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-900 text-textmain">Payment Confirmed!</p>
            <p className="text-sm text-textsub mt-2">Redirecting to your contracts…</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-lg font-900 text-textmain">Payment Processing</p>
            <p className="text-sm text-textsub mt-2 mb-6">
              Your payment is still being confirmed by your bank. Your contract balance will update automatically — check back in a few minutes.
            </p>
            <button
              onClick={() => navigate('/contracts')}
              className="bg-navy text-white font-800 px-6 py-3 rounded-2xl text-sm"
            >
              View Contracts
            </button>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-lg font-900 text-textmain">Payment Not Confirmed</p>
            <p className="text-sm text-textsub mt-2 mb-6">
              If you were charged, contact support with your transaction reference.
            </p>
            <button
              onClick={() => navigate('/contracts')}
              className="bg-navy text-white font-800 px-6 py-3 rounded-2xl text-sm"
            >
              Go to Contracts
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
