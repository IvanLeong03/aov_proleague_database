import Link from "next/link";
import { prisma } from "@/lib/prisma";

const LINKS = [
    //{ href: "/competitions", label: "Competitions" },
    { href: "/teams", label: "Teams" },
    { href: "/heroes", label: "Heroes" },
    { href: "/series/new", label: "New series" },
];

export async function NavBar() {
    const competitions = await prisma.competition.findMany({            
            select: {name: true, shortCode: true},
            orderBy: { name: "desc" }
        });

    return (
        <nav className="border-b px-6 py-3 flex gap-8 items-center bg-[#2d2d2d]">
            <Link href="/" className="font-medium text-lg">
                AOV Pro League
            </Link>
            <div className="group relative">
                <span className="cursor-pointer text-gray-400 hover:text-white/80">Competitions</span>
                <div className="hidden group-hover:block absolute bg-[#131313] p-2 w-60">
                    <ul className="flex flex-col space-y-4">
                        {competitions.map((c) => (
                        <Link 
                            key={c.shortCode} 
                            href={`/competitions/${c.shortCode}`} 
                            className="text-gray-500 hover:text-white/90"
                        >
                            <li>
                                {c.name}
                            </li>                            
                        </Link>
                    ))}
                    </ul>
                    
                </div>
            </div>
            <div className="space-x-8">                
                {LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="text-gray-400 hover:text-white/80">
                        {link.label}
                    </Link>
                ))}
            </div>
            
        </nav>
    );
}
