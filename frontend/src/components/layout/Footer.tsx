import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-white font-bold text-lg mb-3">SAHA Transport & Logistics</h4>
          <p className="text-sm">Un colis, un sourire…</p>
          <p className="text-sm mt-2">Transport vers le Cameroun depuis l&apos;Europe.</p>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">Liens utiles</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/services" className="hover:text-white">Services</Link></li>
            <li><Link href="/tarifs" className="hover:text-white">Tarifs</Link></li>
            <li><Link href="/calendrier" className="hover:text-white">Calendrier</Link></li>
            <li><Link href="/suivi" className="hover:text-white">Suivi de demande</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Confidentialité</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">Contact</h5>
          <p className="text-sm">WhatsApp : <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">via WhatsApp</a></p>
          <p className="text-sm mt-2">Email : contact@sahatransport.com</p>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs">
        &copy; {new Date().getFullYear()} SAHA Transport & Logistics. Tous droits réservés. | <Link href="/privacy" className="underline">Confidentialité</Link>
      </div>
    </footer>
  );
}