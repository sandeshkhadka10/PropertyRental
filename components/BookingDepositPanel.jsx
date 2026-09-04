'use client';
import {useState, useEffect} from 'react';
import {toast} from 'react-toastify';
import {FaLock, FaCheckCircle, FaSpinner} from 'react-icons/fa';
import {formatNPR} from '@/utils/formatCurrency';
import {calculateBalanceDue, DEPOSIT_PERCENT} from '@/utils/depositPricing';

// eSewa green and Khalti purple, so each option is recognisable at a glance.
const GATEWAY_STYLES = {
    esewa:{accent:'#60BB46', blurb:'Pay with your eSewa wallet'},
    khalti:{accent:'#5C2D91', blurb:'Pay with your Khalti wallet'}
};

// eSewa's ePay v2 takes a browser form POST rather than a link, so the fields
// the server signed are submitted from a throwaway form.
const postToGateway = (action, fields) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;

    Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
};

const BookingDepositPanel = ({booking}) => {
    const [gateways, setGateways] = useState([]);
    const [selected, setSelected] = useState('esewa');
    const [redirecting, setRedirecting] = useState(false);

    const deposit = booking?.deposit ?? {};
    const isPaid = deposit.status === 'paid';
    const isConfirmed = booking?.status === 'confirmed';
    const balanceDue = calculateBalanceDue(booking?.totalPrice, deposit.amount);

    useEffect(() => {
        const loadGateways = async () => {
            try{
                const res = await fetch('/api/payments/gateways');
                if(!res.ok){
                    return;
                }
                const data = await res.json();
                const usable = data.filter((gateway) => gateway.enabled);
                setGateways(usable);
                if(usable.length > 0){
                    setSelected(usable[0].id);
                }
            }catch(error){
                console.log(error);
            }
        };
        loadGateways();
    }, []);

    const handlePay = async () => {
        setRedirecting(true);
        try{
            const res = await fetch('/api/payments/initiate',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({bookingId:booking._id, gateway:selected})
            });
            const result = await res.json();

            if(!res.ok){
                toast.error(result.message || 'Could not start the payment');
                setRedirecting(false);
                return;
            }

            // Either way the browser leaves this page, so the spinner stays on.
            if(result.method === 'form'){
                postToGateway(result.action, result.fields);
            }else{
                window.location.href = result.paymentUrl;
            }
        }catch(error){
            console.log(error);
            toast.error('Could not reach the payment service');
            setRedirecting(false);
        }
    };

    if(isPaid){
        return (
            <div className='bg-white p-6 rounded-lg shadow-md'>
                <h3 className='text-xl font-bold mb-4 flex items-center'>
                    <FaCheckCircle className='text-green-600 mr-2'/> Deposit Paid
                </h3>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                        <span className='text-gray-600'>Amount paid</span>
                        <span className='font-bold text-green-700'>{formatNPR(deposit.amount)}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-gray-600'>Paid with</span>
                        <span className='font-semibold capitalize'>{deposit.gateway}</span>
                    </div>
                    {deposit.referenceId && (
                        <div className='flex justify-between'>
                            <span className='text-gray-600'>Reference</span>
                            <span className='font-mono text-xs break-all'>{deposit.referenceId}</span>
                        </div>
                    )}
                    {deposit.paidAt && (
                        <div className='flex justify-between'>
                            <span className='text-gray-600'>Paid on</span>
                            <span>{new Date(deposit.paidAt).toLocaleString('en-GB')}</span>
                        </div>
                    )}
                </div>
                <p className='text-gray-600 text-sm mt-4'>
                    {formatNPR(balanceDue)} is due to the owner on arrival.
                </p>
            </div>
        );
    }

    return (
        <div className='bg-white p-6 rounded-lg shadow-md'>
            <h3 className='text-xl font-bold mb-2'>Secure this booking</h3>
            <p className='text-gray-600 text-sm mb-4'>
                A {DEPOSIT_PERCENT}% deposit holds your dates. The remaining{' '}
                {formatNPR(balanceDue)} is paid to the owner on arrival.
            </p>

            <div className='flex justify-between items-baseline border-y border-gray-200 py-3 mb-4'>
                <span className='text-gray-600'>Deposit due now</span>
                <span className='text-2xl font-bold text-blue-500'>
                    {formatNPR(deposit.amount)}
                </span>
            </div>

            {!isConfirmed ? (
                <p className='bg-blue-50 text-blue-800 text-sm rounded-lg p-3'>
                    {booking?.status === 'pending'
                        ? 'The owner has not accepted this request yet. You can pay the deposit as soon as they do.'
                        : `A ${booking?.status} booking cannot take a deposit.`}
                </p>
            ) : gateways.length === 0 ? (
                <p className='bg-yellow-50 text-yellow-800 text-sm rounded-lg p-3'>
                    No payment method is configured on this server yet.
                </p>
            ) : (
                <>
                    <div className='space-y-2 mb-4'>
                        {gateways.map((gateway) => {
                            const style = GATEWAY_STYLES[gateway.id] ?? {};
                            const isSelected = selected === gateway.id;
                            return (
                                <label
                                    key={gateway.id}
                                    className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition ${
                                        isSelected ? 'bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    style={isSelected ? {borderColor:style.accent} : undefined}
                                >
                                    <input
                                        type='radio'
                                        name='gateway'
                                        value={gateway.id}
                                        checked={isSelected}
                                        onChange={() => setSelected(gateway.id)}
                                        className='accent-blue-500'
                                    />
                                    <span
                                        className='w-3 h-3 rounded-full'
                                        style={{backgroundColor:style.accent}}
                                    ></span>
                                    <span className='flex-1'>
                                        <span className='block font-bold'>{gateway.label}</span>
                                        <span className='block text-xs text-gray-500'>{style.blurb}</span>
                                    </span>
                                    {gateway.mode === 'sandbox' && (
                                        <span className='text-[10px] uppercase tracking-wide bg-gray-200 text-gray-700 rounded px-2 py-1'>
                                            Sandbox
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    <button
                        type='button'
                        onClick={handlePay}
                        disabled={redirecting}
                        className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-full w-full flex items-center justify-center'
                    >
                        {redirecting ? (
                            <>
                                <FaSpinner className='mr-2 animate-spin'/> Redirecting...
                            </>
                        ) : (
                            <>
                                <FaLock className='mr-2'/> Pay {formatNPR(deposit.amount)} deposit
                            </>
                        )}
                    </button>

                    <p className='text-xs text-gray-500 mt-3 text-center'>
                        You will be taken to the wallet to authorise the payment.
                    </p>
                </>
            )}
        </div>
    );
};

export default BookingDepositPanel;
