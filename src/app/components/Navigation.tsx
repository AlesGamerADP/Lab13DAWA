import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Navigation() {
    const session = await getServerSession(authOptions);

    return (
        <nav className="w-full bg-black shadow-sm">
            <div className="max-w-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-semibold text-white">
                    MyAuthApp
                </Link>

                {session?.user ? (
                    <ul className="flex items-center justify-center gap-6 text-sm text-white">
                        <li>
                            <Link href="/dashboard" className="hover:text-gray-400">
                                Dashboard
                            </Link>
                        </li>

                        <li>
                            <Link href="/profile" className="hover:text-gray-400">
                                Profile
                            </Link>
                        </li>

                        <li>
                            <LogoutButton />
                        </li>

                        {session?.user?.image && (
                            <li>
                                <Image
                                    height={40}
                                    width={40}
                                    src={session.user.image}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full"
                                />
                            </li>
                        )}
                    </ul>
                ) : (
                    <ul className="flex items-center justify-center gap-6 text-sm text-white">
                        <li>
                            <Link href="/signIn" className="hover:text-gray-400">
                                Sign In
                            </Link>
                        </li>
                        <li>
                            <Link href="/register" className="hover:text-gray-400">
                                Register
                            </Link>
                        </li>
                    </ul>
                )}
            </div>
        </nav>
    );
}

