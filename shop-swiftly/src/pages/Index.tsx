import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import ProductCard from "@/components/products/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import heroImage from "@/assets/hero.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, Phone, Monitor, Laptop, Printer, Headphones, Keyboard, Speaker } from "lucide-react";
import { useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
} as const;

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
} as const;

const fallbackStyle = { icon: Monitor, gradient: "from-blue-600 to-blue-800" };

const Index = () => {
  const { data } = useQuery({
    queryKey: ['products', { limit: 4 }],
    queryFn: () => api.getProducts({ sort: "newest" })
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });

  const featured = data?.products?.slice(0, 4) || [];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* === HERO === */}
      <section ref={heroRef} className="relative h-[92vh] min-h-[600px] overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img src={heroImage} alt="SEMMS GenTech Technology Devices" className="absolute inset-0 w-full h-full object-cover object-center" />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Animated scan line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,100,255,0.03) 50%, transparent 100%)" }}
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <motion.div style={{ opacity: heroOpacity }} className="relative h-full flex flex-col justify-center">
          <div className="container-wide">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.span
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-xl mb-8 text-sm font-semibold tracking-wider uppercase"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Upgrade Your Technology Today
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-white text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight"
              >
                Smart Technology
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  for Everyone
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-white/80 text-lg md:text-xl mb-10 max-w-lg leading-relaxed"
              >
                High-quality computers, laptops, printers & accessories. Reliable technology solutions across Tamil Nadu.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 text-lg px-10 py-7 rounded-xl font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link to="/products" className="flex items-center gap-2">
                    Shop Now <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <a
                  href="tel:8637423024"
                  className="flex items-center justify-center gap-3 text-white bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl border border-white/20 font-medium hover:bg-white/20 transition-all duration-300"
                >
                  <Phone className="w-5 h-5" />
                  8637423024
                </a>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={4}
                className="text-white/60 text-sm font-medium flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Service Available All Over Tamil Nadu
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* === STATS BAR === */}
      <section className="relative -mt-16 z-10">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: "500+", label: "Products Delivered" },
              { value: "100+", label: "Happy Customers" },
              { value: "10+", label: "Categories" },
              { value: "TN Wide", label: "Service Coverage" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                custom={i}
                className="bg-card border border-border/50 rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === ABOUT === */}
      <section className="container-wide py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeUp}>
            <span className="text-sm font-bold uppercase tracking-widest text-primary mb-3 block">About Us</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Trusted Technology
              <br />
              <span className="text-primary">Provider</span>
            </h2>
            <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
              <p>
                SEMMS GenTech is a trusted technology product provider delivering quality computer hardware and accessories to customers across Tamil Nadu.
              </p>
              <p>
                Our mission is to provide reliable, affordable, and modern technology solutions that help businesses and individuals stay connected, productive, and efficient.
              </p>
              <p>
                Operating under SEMMS Solutions, we focus on delivering technology services, digital solutions, and IT support with a commitment to quality and customer satisfaction.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 md:p-10 border border-border/50 space-y-5">
              <h3 className="text-2xl font-bold mb-6">Why Choose Us</h3>
              {[
                "Trusted Technology Provider",
                "Quality Tested Products",
                "Competitive Pricing",
                "Reliable Customer Support",
                "Service Across Tamil Nadu",
                "Business & Personal Solutions"
              ].map((reason, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground/90">{reason}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* === PRODUCT CATEGORIES === */}
      <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="text-sm font-bold uppercase tracking-widest text-primary mb-3 block">
              Our Products
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
              Product Categories
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every product is selected carefully to ensure performance, durability, and value for money.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5"
          >
            {categories.map((cat: any, index: number) => {
              const style = fallbackStyle;
              const Icon = style.icon;
              return (
                <motion.div key={cat.id} variants={scaleIn} custom={index}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group relative flex flex-col items-center text-center bg-card border border-border hover:border-primary/40 rounded-2xl p-6 py-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${style.gradient} transition-opacity duration-500`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold relative z-10">{cat.name}</h3>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* === FEATURED PRODUCTS === */}
      <section className="container-wide py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <div className="flex flex-col sm:flex-row items-end justify-between mb-12 gap-4">
            <motion.div variants={fadeUp}>
              <span className="text-sm font-bold uppercase tracking-widest text-primary mb-3 block">Featured</span>
              <h2 className="text-4xl md:text-5xl font-bold">Latest Products</h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                View All Products
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="transition-shadow duration-300 hover:shadow-xl rounded-2xl"
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === SERVICE & CONTACT === */}
      <section className="relative py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-800 to-blue-950" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />

        <div className="container-wide relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <motion.div variants={fadeUp} className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Service Coverage
                <br />
                <span className="text-blue-300">Across Tamil Nadu</span>
              </h2>
              <p className="text-white/80 text-lg mb-5 leading-relaxed">
                Whether you are an individual customer, a startup, or an established business, we ensure smooth product delivery and reliable assistance.
              </p>
              <p className="text-white/80 text-lg mb-10 leading-relaxed">
                Get the latest technology products at competitive prices with trusted service and fast support.
              </p>

              <motion.div
                variants={fadeUp}
                custom={2}
                className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-colors duration-300"
              >
                <h3 className="text-xl font-bold mb-2 text-white">Authorized Representative</h3>
                <p className="font-semibold text-lg text-blue-200">Yasir Ahamed Sha M</p>
                <p className="text-white/70 mt-3 text-sm leading-relaxed">
                  SEMMS GenTech operates under the guidance and authorization of Yasir Ahamed Sha M, ensuring professional management and trusted service.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="bg-background text-foreground p-8 md:p-12 rounded-3xl shadow-2xl"
            >
              <h2 className="text-3xl font-bold mb-10">Contact Us</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-xl text-primary mb-1">SEMMS GenTech</h3>
                  <p className="text-muted-foreground">Running Under SEMMS Solutions</p>
                </div>

                {[
                  {
                    icon: MapPin,
                    title: "Address",
                    content: (
                      <>6/4, Kayithey Millatheru<br />Vasthavi Yas-Mas Complex<br />Aruppukottai – 626101<br />Tamil Nadu, India</>
                    )
                  },
                  { icon: Phone, title: "Phone", content: "8637423024" },
                  { icon: CheckCircle2, title: "Service Area", content: "All Over Tamil Nadu" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-5 items-start group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
