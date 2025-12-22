import Header from "@/components/layout/Header";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
