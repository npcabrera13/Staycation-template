import React from 'react';
import { Lock, Mail, AlertTriangle, Phone, User } from 'lucide-react';

interface LockoutScreenProps {
    contactEmail?: string;
    contactPhone?: string;
    providerName?: string;
    siteName?: string;
}

const LockoutScreen: React.FC<LockoutScreenProps> = ({
    contactEmail = 'support@example.com',
    contactPhone = '',
    providerName = '',
    siteName = 'This website'
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Animated Lock Icon */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center">
                            <Lock className="text-red-400" size={32} />
                        </div>
                    </div>
                </div>

                {/* Main Message */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <AlertTriangle className="text-yellow-400" size={20} />
                        <span className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">Subscription Inactive</span>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-3">
                        Website Access Suspended
                    </h1>

                    <p className="text-gray-400 mb-6 leading-relaxed">
                        {siteName}'s subscription has expired or has not been activated yet.
                        Please contact {providerName || 'the service provider'} to renew your plan.
                    </p>

                    {/* Contact Section */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Contact Support</p>

                        {providerName && (
                            <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                                <User size={14} className="text-gray-400" />
                                <span className="font-medium">{providerName}</span>
                            </div>
                        )}

                        {contactEmail && (
                            <a
                                href={`mailto:${contactEmail}`}
                                className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm"
                            >
                                <Mail size={14} />
                                {contactEmail}
                            </a>
                        )}

                        {contactPhone && (
                            <a
                                href={`tel:${contactPhone}`}
                                className="flex items-center justify-center gap-2 text-green-400 hover:text-green-300 transition-colors font-medium text-sm"
                            >
                                <Phone size={14} />
                                {contactPhone}
                            </a>
                        )}
                    </div>

                    {/* Retry Button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Retry Connection
                    </button>
                </div>

                <p className="text-gray-600 text-xs mt-6">
                    Your data is safe and will be available once the subscription is renewed.
                </p>
            </div>
        </div>
    );
};

export default LockoutScreen;
