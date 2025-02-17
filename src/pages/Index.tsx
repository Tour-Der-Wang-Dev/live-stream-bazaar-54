
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Video } from "lucide-react";
import WebinarList from "@/components/WebinarList";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold mb-6 text-white bg-clip-text"
          >
            Webinars en Directo
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto"
          >
            Únete a nuestros webinars interactivos y aprende de expertos en tiempo real
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/create")}
              className="bg-white hover:bg-purple-50 text-purple-700 font-semibold px-8 py-6 text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl rounded-xl"
            >
              <Video className="mr-3 h-6 w-6" />
              Crear Nuevo Webinar
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl"
        >
          <WebinarList />
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 transform rotate-12 scale-150" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/40 via-transparent to-transparent" />
      </div>
    </div>
  );
};

export default Index;
