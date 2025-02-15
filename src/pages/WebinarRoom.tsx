
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
  LocalUserChoices,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import {
  Track,
  RoomEvent,
  Room,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
  DataPacket_Kind
} from 'livekit-client';
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const fetchWebinar = async (id: string): Promise<Webinar | null> => {
  console.log('Fetching webinar with ID:', id);
  
  if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('ID inválido:', id);
    return null;
  }

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener webinar:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startTime: new Date(data.start_time),
    hostName: data.host_name,
    roomName: data.room_name
  };
};

const WebinarRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [liveKitUrl] = useState("wss://juliawebinars-brslrae2.livekit.cloud");
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks();

  const { data: webinar, isLoading } = useQuery({
    queryKey: ['webinar', id],
    queryFn: () => fetchWebinar(id || ''),
    enabled: !!id
  });

  useEffect(() => {
    if (!localParticipant) return;

    const handleTranscript = async (transcript: string) => {
      try {
        const { error } = await supabase.functions.invoke('webinar-agent', {
          body: {
            action: 'save_transcript',
            webinarId: id,
            text: transcript
          }
        });

        if (error) throw error;
        setTranscript(prev => prev + " " + transcript);
      } catch (error) {
        console.error('Error saving transcript:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la transcripción"
        });
      }
    };

    const handleData = (data: Uint8Array) => {
      const text = new TextDecoder().decode(data);
      console.log('Transcripción recibida:', text);
      handleTranscript(text);
    };

    // Configurar transcripción para participante local
    const handleAudioTrack = (track: TrackPublication) => {
      if (track.kind === Track.Kind.Audio) {
        console.log('Nueva pista de audio detectada');
        track.on('datapublished', handleData);
      }
    };

    // Suscribirse a pistas existentes
    localParticipant.tracks.forEach(handleAudioTrack);

    // Suscribirse a nuevas pistas
    localParticipant.on('trackPublished', handleAudioTrack);

    return () => {
      localParticipant.tracks.forEach(track => {
        if (track.kind === Track.Kind.Audio) {
          track.off('datapublished', handleData);
        }
      });
      localParticipant.off('trackPublished', handleAudioTrack);
    };
  }, [localParticipant, id]);

  const generateToken = async (participantName: string): Promise<string> => {
    try {
      console.log('Generando token para:', participantName);
      
      if (!webinar?.roomName) {
        throw new Error('Nombre de sala no encontrado');
      }

      console.log('Enviando solicitud al endpoint de LiveKit');
      
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: {
          roomName: webinar.roomName,
          participantName: participantName
        },
      });

      if (error) {
        console.error('Error completo:', error);
        throw new Error('Error al generar el token de acceso: ' + error.message);
      }

      if (!data?.token || typeof data.token !== 'string') {
        console.error('Token inválido recibido:', data);
        throw new Error('Token inválido recibido del servidor');
      }

      console.log('Token recibido (primeros 20 caracteres):', data.token.substring(0, 20));
      return data.token;

    } catch (err) {
      console.error('Error al generar el token:', err);
      throw err;
    }
  };

  const handleJoinWebinar = async (values: LocalUserChoices) => {
    try {
      setIsJoining(true);
      setError('');
      console.log('Iniciando proceso de unión al webinar para:', values.username);

      const newToken = await generateToken(values.username);
      console.log('Token válido obtenido, longitud:', newToken.length);
      setToken(newToken);
      setUserName(values.username);
    } catch (err: any) {
      console.error('Error al unirse al webinar:', err);
      setError(err.message || 'Error al unirse al webinar. Por favor, intente nuevamente.');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "No se pudo unir al webinar. Por favor, verifique la configuración."
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAskingQuestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('webinar-agent', {
        body: {
          action: 'ask_question',
          webinarId: id,
          question
        }
      });

      if (error) throw error;
      setAnswer(data.answer);
      setQuestion("");
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar tu pregunta"
      });
    } finally {
      setIsAskingQuestion(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cargando...</h2>
        </Card>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Webinar no encontrado</h2>
          <Button onClick={() => navigate('/')} className="w-full">
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {token ? (
        <div className="h-screen flex flex-col">
          <LiveKitRoom
            token={token}
            serverUrl={liveKitUrl}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={() => navigate("/")}
          >
            <div className="flex-1">
              <VideoConference />
            </div>
            
            <div className="h-1/3 bg-white dark:bg-gray-800 border-t">
              <div className="container mx-auto p-4 h-full flex gap-4">
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">Transcripción en vivo</h3>
                  <ScrollArea className="flex-1 p-4 border rounded-lg">
                    <p className="whitespace-pre-wrap">{transcript}</p>
                  </ScrollArea>
                </div>

                <div className="w-96 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">Preguntas al agente</h3>
                  <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                    {answer && (
                      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                        <p className="text-sm">{answer}</p>
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Haz una pregunta sobre el webinar..."
                      disabled={isAskingQuestion}
                    />
                    <Button 
                      type="submit" 
                      disabled={isAskingQuestion}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      Preguntar
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </LiveKitRoom>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-2xl mx-auto p-8">
              <h1 className="text-3xl font-bold mb-4">{webinar.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{webinar.description}</p>
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Anfitrión: {webinar.hostName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fecha: {webinar.startTime.toLocaleDateString()}
                </p>
              </div>
              <PreJoin
                onError={(err) => setError(err.message)}
                onSubmit={handleJoinWebinar}
              />
              {error && (
                <p className="text-red-500 mt-4 text-center">{error}</p>
              )}
              {isJoining && (
                <p className="text-blue-500 mt-4 text-center">
                  Conectando al webinar...
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WebinarRoom;
