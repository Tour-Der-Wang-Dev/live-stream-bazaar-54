
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
  RoomAudioRenderer,
} from "@livekit/components-react";
import {
  Track,
  RoomEvent,
  Room,
  DataPacket_Kind,
  RemoteParticipant,
  LocalParticipant,
  LocalTrackPublication,
  LocalAudioTrack,
} from 'livekit-client';
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Mic, Calendar, Clock } from "lucide-react";

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

const WebinarContent = ({ 
  webinarId, 
  onDisconnect 
}: { 
  webinarId: string;
  onDisconnect: () => void;
}) => {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const { toast } = useToast();
  const { localParticipant } = useLocalParticipant();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    if (!localParticipant) {
      console.log('[Transcription] No local participant yet');
      return;
    }
    
    console.log('[Transcription] Local participant ready:', {
      identity: localParticipant.identity,
      hasAudioTrack: Array.from(localParticipant.tracks.values()).some(pub => pub.kind === Track.Kind.Audio),
      trackCount: localParticipant.tracks.size
    });

    const handleTranscript = async (text: string) => {
      if (!text.trim()) {
        console.log('[Transcription] Empty transcript received, skipping');
        return;
      }

      console.log('[Transcription] Processing text:', text.trim());
      try {
        const { data, error } = await supabase.functions.invoke('webinar-agent', {
          body: {
            action: 'save_transcript',
            webinarId,
            text: text.trim()
          }
        });

        if (error) {
          console.error('[Transcription] Error from edge function:', error);
          throw error;
        }

        console.log('[Transcription] Saved successfully:', data);
        setTranscript(prev => prev + " " + text.trim());
      } catch (error: any) {
        console.error('[Transcription] Error saving:', error);
        toast({
          variant: "destructive",
          title: "Error al procesar transcripción",
          description: error.message || "No se pudo guardar la transcripción"
        });
      }
    };

    const setupTranscription = async () => {
      try {
        console.log('[Transcription] Setting up transcription...');
        
        const audioTrack = Array.from(localParticipant.tracks.values())
          .find(pub => pub.kind === Track.Kind.Audio)
          ?.track as LocalAudioTrack | undefined;

        if (!audioTrack) {
          console.warn('[Transcription] No audio track found');
          return;
        }

        console.log('[Transcription] Found audio track:', {
          trackName: audioTrack.mediaStreamTrack.label,
          state: audioTrack.mediaStreamTrack.readyState,
          enabled: audioTrack.mediaStreamTrack.enabled
        });

        const newAudioContext = new AudioContext({ sampleRate: 16000 });
        setAudioContext(newAudioContext);

        const source = newAudioContext.createMediaStreamSource(audioTrack.mediaStream);
        const processor = newAudioContext.createScriptProcessor(4096, 1, 1);
        const analyser = newAudioContext.createAnalyser();
        
        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(newAudioContext.destination);

        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let audioBuffer: Float32Array[] = [];
        let lastVoiceActivity = Date.now();
        let isRecording = false;

        processor.onaudioprocess = async (e) => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const hasVoice = average > 15; // Reducido el umbral para mayor sensibilidad

          if (hasVoice) {
            lastVoiceActivity = Date.now();
            if (!isRecording) {
              isRecording = true;
              audioBuffer = [];
              console.log('[Transcription] Started recording');
            }
            audioBuffer.push(new Float32Array(e.inputBuffer.getChannelData(0)));
          } else if (isRecording && Date.now() - lastVoiceActivity > 1000) {
            isRecording = false;
            if (audioBuffer.length > 0) {
              console.log('[Transcription] Stopped recording, processing audio...');
              const combinedBuffer = new Float32Array(audioBuffer.reduce((acc, curr) => acc + curr.length, 0));
              let offset = 0;
              audioBuffer.forEach(buffer => {
                combinedBuffer.set(buffer, offset);
                offset += buffer.length;
              });

              // Convert to base64
              const audioBlob = new Blob([combinedBuffer.buffer], { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                
                try {
                  const { data, error } = await supabase.functions.invoke('webinar-agent', {
                    body: {
                      action: 'transcribe_audio',
                      audio: base64Audio
                    }
                  });

                  if (error) throw error;
                  if (data?.text) {
                    console.log('[Transcription] Received text:', data.text);
                    await handleTranscript(data.text);
                  }
                } catch (error) {
                  console.error('[Transcription] Error processing audio:', error);
                  toast({
                    variant: "destructive",
                    title: "Error en la transcripción",
                    description: "No se pudo procesar el audio"
                  });
                }
              };
              reader.readAsDataURL(audioBlob);
            }
            audioBuffer = [];
          }
        };

        setIsTranscribing(true);
        toast({
          title: "Transcripción iniciada",
          description: "El audio está siendo procesado"
        });

        return () => {
          processor.disconnect();
          analyser.disconnect();
          source.disconnect();
          if (newAudioContext.state !== 'closed') {
            newAudioContext.close();
          }
          setIsTranscribing(false);
        };
      } catch (error: any) {
        console.error('[Transcription] Setup error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al configurar la transcripción: " + error.message
        });
      }
    };

    const interval = setInterval(() => {
      const hasAudioTrack = Array.from(localParticipant.tracks.values()).some(
        pub => pub.kind === Track.Kind.Audio
      );

      if (hasAudioTrack && !isTranscribing) {
        setupTranscription();
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      setIsTranscribing(false);
    };
  }, [localParticipant, webinarId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !localParticipant) return;

    setIsAskingQuestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('webinar-agent', {
        body: {
          action: 'ask_question',
          webinarId,
          question
        }
      });

      if (error) throw error;
      
      console.log('Answer received:', data);
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <RoomAudioRenderer />
      <div className="flex-1 p-4">
        <div className="rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-800">
          <VideoConference />
        </div>
      </div>
      
      <div className="h-2/5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto p-6 h-full flex gap-6">
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Transcripción en vivo</h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {transcript || "La transcripción aparecerá aquí cuando comience..."}
              </p>
            </ScrollArea>
          </div>

          <div className="w-[400px] flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Asistente del Webinar</h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              {answer ? (
                <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg border border-green-100 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300">{answer}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
                  Haz una pregunta sobre el contenido del webinar
                </p>
              )}
            </ScrollArea>

            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta sobre el webinar..."
                disabled={isAskingQuestion}
                className="bg-white dark:bg-gray-800"
              />
              <Button 
                type="submit" 
                disabled={isAskingQuestion}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Preguntar
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const WebinarRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [liveKitUrl] = useState("wss://juliawebinars-brslrae2.livekit.cloud");

  const { data: webinar, isLoading } = useQuery({
    queryKey: ['webinar', id],
    queryFn: () => fetchWebinar(id || ''),
    enabled: !!id
  });

  const generateToken = async (participantName: string): Promise<string> => {
    try {
      if (!webinar?.roomName) {
        throw new Error('Nombre de sala no encontrado');
      }

      console.log('Generando token para:', participantName, 'en sala:', webinar.roomName);
      
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: {
          roomName: webinar.roomName,
          participantName
        },
      });

      if (error) throw error;
      if (!data?.token) throw new Error('Token no recibido');

      console.log('Token generado exitosamente');
      return data.token;
    } catch (err: any) {
      console.error('Error generando token:', err);
      throw new Error('Error al generar el token de acceso: ' + err.message);
    }
  };

  const handleJoinWebinar = async (values: LocalUserChoices) => {
    try {
      setIsJoining(true);
      setError('');
      
      console.log('Iniciando proceso de unión al webinar');
      const newToken = await generateToken(values.username);
      
      console.log('Token obtenido, conectando a LiveKit');
      setToken(newToken);
    } catch (err: any) {
      console.error('Error al unirse al webinar:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al unirse",
        description: err.message
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || !webinar) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 shadow-xl">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {token ? (
        <LiveKitRoom
          token={token}
          serverUrl={liveKitUrl}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={() => {
            console.log('Desconectado de LiveKit');
            navigate("/");
          }}
        >
          <WebinarContent webinarId={id || ''} onDisconnect={() => navigate("/")} />
        </LiveKitRoom>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-2xl mx-auto p-8 shadow-2xl">
              <h1 className="text-3xl font-bold mb-6 text-center">{webinar.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-center leading-relaxed">
                {webinar.description}
              </p>
              
              <div className="flex justify-center gap-8 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {webinar.startTime.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {webinar.startTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <PreJoin
                onError={(err) => setError(err.message)}
                onSubmit={handleJoinWebinar}
              />
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mt-4 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded"
                >
                  {error}
                </motion.p>
              )}
              
              {isJoining && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-blue-500 mt-4 text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded"
                >
                  Conectando al webinar...
                </motion.p>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WebinarRoom;
