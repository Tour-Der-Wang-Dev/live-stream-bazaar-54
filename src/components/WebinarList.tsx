
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fetchWebinars = async (): Promise<Webinar[]> => {
  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error al obtener webinars:', error);
    throw error;
  }

  return (data || []).map(webinar => ({
    id: webinar.id,
    title: webinar.title,
    description: webinar.description,
    startTime: new Date(webinar.start_time),
    hostName: webinar.host_name,
    roomName: webinar.room_name
  }));
};

const WebinarList = () => {
  const navigate = useNavigate();
  const { data: webinars, isLoading } = useQuery({
    queryKey: ['webinars'],
    queryFn: fetchWebinars
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Cargando webinars...</p>
      </div>
    );
  }

  if (!webinars?.length) {
    return (
      <div className="text-center py-8">
        <p>No hay webinars programados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {webinars.map((webinar, index) => (
        <motion.div
          key={webinar.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">
                {webinar.startTime.toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{webinar.title}</h3>
            <p className="text-gray-600 mb-4">{webinar.description}</p>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">{webinar.hostName}</span>
            </div>
            <Button 
              onClick={() => navigate(`/webinar/${webinar.id}`)}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Unirse al Webinar
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default WebinarList;
