import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import { Audio } from "expo-av";

const recordingState = {
  NOT_STARTED: "NOT_STARTED",
  RECORDING: "RECORDING",
};

export default function App() {
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [audioURI, setAudioURI] = useState([]);
  const [currentRecordingState, setCurrentRecordingState] = useState(
    recordingState.NOT_STARTED
  );

  async function playSound(uri) {
    if (!audioURI) return;
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);

    console.log("Playing Sound");
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  async function startRecording() {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);

      // setAudioURI([]);
      setRecording(recording);
      setCurrentRecordingState(recordingState.RECORDING);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    console.log("stopRecording", recording);
    if (!recording) return;

    console.log("Stopping recording..");
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
    setAudioURI([...audioURI, uri]);
    setCurrentRecordingState(recordingState.NOT_STARTED);
    setRecording(undefined);
  }

  onRecordingStatusUpdate = async (status) => {
    await onRecordingStatusUpdateSynced(status);
  };
  onRecordingStatusUpdateSynced = async (status) => {
    // on iOS, a call will stop the recording
    if (!status.isRecording && status.canRecord) {
      console.log("stopping recording...");
      await stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      {currentRecordingState === recordingState.NOT_STARTED && (
        <Button title={"Start Recording"} onPress={startRecording} />
      )}
      {currentRecordingState === recordingState.RECORDING && (
        <Button
          title={"Stop Recording"}
          onPress={() => recording.pauseAsync()}
        />
      )}
      {!!audioURI.length && <Text style={styles.text}>Playbacks</Text>}
      {audioURI?.map((uri, index) => (
        <Button
          key={uri}
          title={`Play Sound ${index}`}
          onPress={() => playSound(uri)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 10,
  },
  text: {
    textAlign: "center",
    fontSize: 20,
    marginTop: 30,
    marginBottom: 10,
  },
});
