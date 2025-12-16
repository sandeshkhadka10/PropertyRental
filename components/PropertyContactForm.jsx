'use client';
import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { contactSchema, propertySchema } from '@/lib/contactSchema';

const PropertyContactForm = ({ property }) => {
    const { data: session } = useSession();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [phone, setPhone] = useState('');
    const [wasSubmitted, setWasSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        // Update the appropriate state
        if (field === 'name') {
            setName(value);
        } else if (field === 'email') {
            setEmail(value);
        } else if (field === 'phone') {
            setPhone(value);
        } else if (field === 'message') {
            setMessage(value);
        }
        
        // Remove error for this specific field
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            name,
            email,
            phone,
            message,
            recipient: property.owner,
            property: property._id
        }
        try {
            setErrors({});

            const parseData = contactSchema.parse({
                name,
                email,
                phone,
                message
            });

            // const formData = new FormData();

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.status === 200) {
                toast.success(result.message);
                setWasSubmitted(true);
            } else if (res.status === 400 || res.status === 401) {
                toast.error(result.message);
            } else {
                toast.error('Error sending form');
            }
        } catch (error) {
            if (error.name === 'ZodError' && error.issues) {
                const fieldErrors = {};
                error.issues.forEach((issue) => {
                    const path = issue.path.join('.');
                    fieldErrors[path] = issue.message;
                });
                setErrors(fieldErrors);
                return;
            }

            console.log(error);
            toast.error('Error sending form');
        } finally {
            setName('');
            setEmail('');
            setPhone('');
            setMessage('');
        }
        // console.log(data);
    }

    return (
        <div>
            {/* <!-- Contact Form --> */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-6">Contact Property Manager</h3>
                {!session ?
                    (
                        <p>You must be logged in to sent a message</p>
                    )
                    :
                    (
                        wasSubmitted ? (
                            <p className='text-green-500 mb-4'>
                                Your message has been sent successfully
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className='mb-4'>
                                    <label
                                        className='block text-gray-700 text-sm font-bold mb-2'
                                        htmlFor='name'
                                    >
                                        Name:
                                    </label>
                                    <input
                                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                        id='name'
                                        type='text'
                                        placeholder='Enter your name'
                                        value={name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="email"
                                    >
                                        Email:
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                    {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
                                </div>
                                <div className='mb-4'>
                                    <label
                                        className='block text-gray-700 text-sm font-bold mb-2'
                                        htmlFor='phone'
                                    >
                                        Phone:
                                    </label>
                                    <input
                                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                        id='phone'
                                        type='text'
                                        placeholder='Enter your phone number'
                                        value={phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                    {errors.phone && <p className='text-red-500 text-sm'>{errors.phone}</p>}
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="message"
                                    >
                                        Message:
                                    </label>
                                    <textarea
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-44 focus:outline-none focus:shadow-outline"
                                        id="message"
                                        placeholder="Enter your message"
                                        value={message}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                    ></textarea>
                                    {errors.message && <p className='text-red-500 text-sm'>{errors.message}</p>}
                                </div>
                                <div>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline flex items-center justify-center"
                                        type="submit"
                                    >
                                        <FaPaperPlane className="mr-2" /> Send Message
                                    </button>
                                </div>
                            </form>
                        )

                    )
                }
            </div>
        </div>
    )
}

export default PropertyContactForm;