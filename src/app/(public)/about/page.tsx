export default function AboutPage() {
    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">About Us</h2>
                    <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Empowering Travel Agencies.
                    </p>
                    <div className="max-w-xl mx-auto mt-5 text-xl text-gray-500">
                        <p>
                            At AgencyManager, we believe that running a travel business should be about the journey, not the paperwork.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="prose prose-lg mx-auto text-gray-500">
                    <p>
                        Started in 2024, AgencyManager was built to solve the unique challenges faced by Hajj & Umrah providers. From complex visa tracking to customer accounting, our tools are designed by industry experts.
                    </p>
                    <h3>Our Mission</h3>
                    <p>
                        To provide a unified, secure, and intelligent platform that automates the mundane, so agents can focus on serving the Guests of Allah.
                    </p>
                    <h3>Why Choose Us?</h3>
                    <ul>
                        <li>Specialized for Hajj & Umrah workflows</li>
                        <li>Secure customer data management</li>
                        <li>Integrated accounting & invoicing</li>
                        <li>Pakistani-market optimized (CNIC, Local Payment Methods)</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
