
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

const CreateWebinar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startTime = formData.get('startTime') as string;
    const roomName = uuidv4(); // Generamos un ID único para la sala

    try {
      // Obtenemos el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const { error } = await supabase
        .from('webinars')
        .insert({
          title,
          description,
          start_time: startTime,
          host_name: user.email, // Usamos el email del usuario como host_name
          room_name: roomName
        });

      if (error) throw error;

      toast({
        title: "Webinar creado con éxito",
        description: "Tu webinar ha sido programado correctamente.",
      });

      navigate("/");
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast({
        variant: "destructive",
        title: "Error al crear el webinar",
        description: "Por favor intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Crear Nuevo Webinar</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título del Webinar
                </label>
                <Input
                  name="title"
                  required
                  placeholder="Ej: Introducción a React"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción
                </label>
                <Textarea
                  name="description"
                  required
                  placeholder="Describe tu webinar..."
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha y Hora
                </label>
                <Input
                  name="startTime"
                  type="datetime-local"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Video className="mr-2 h-5 w-5" />
                  {loading ? "Creando..." : "Crear Webinar"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateWebinar;
