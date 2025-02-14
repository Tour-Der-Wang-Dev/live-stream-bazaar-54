
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, Video } from "lucide-react";
import WebinarList from "@/components/WebinarList";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Webinars en Directo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Únete a nuestros webinars interactivos y aprende de expertos
          </p>
          <Button
            onClick={() => navigate("/create")}
            className="bg-black hover:bg-gray-800 text-white transition-all duration-300 transform hover:scale-105"
          >
            <Video className="mr-2 h-5 w-5" />
            Crear Nuevo Webinar
          </Button>
        </motion.div>

        <WebinarList />
      </div>
    </div>
  );
};

export default Index;
