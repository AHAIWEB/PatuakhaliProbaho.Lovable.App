import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArchiveHub } from "@/components/archive-hub";

const ArchivePage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 container mx-auto px-4 py-6">
      <ArchiveHub />
    </main>
    <Footer />
  </div>
);

export default ArchivePage;
