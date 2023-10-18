import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import { Audio } from "expo-av";

const recordingState = {
  NOT_STARTED: "NOT_STARTED",
  RECORDING: "RECORDING",
  PAUSED: "PAUSED",
};

export default function App() {
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [audioURI, setAudioURI] = useState();
  const [currentRecordingState, setCurrentRecordingState] = useState(
    recordingState.NOT_STARTED
  );

  async function playSound() {
    if (!audioURI) return;
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({ uri: audioURI });
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
    if (recording) {
      console.log("Resuming recording...");
      setCurrentRecordingState(recordingState.RECORDING);
      recording.startAsync();
      return;
    }

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

      setAudioURI(null);
      setRecording(recording);
      setCurrentRecordingState(recordingState.RECORDING);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function pauseRecording() {
    if (!recording) return;
    console.log("Pausing recording...");
    await recording.pauseAsync();
    setCurrentRecordingState(recordingState.PAUSED);
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
    setAudioURI(uri);
    setCurrentRecordingState(recordingState.NOT_STARTED);
  }

  onRecordingStatusUpdate = (status) => {
    // on iOS, a call will stop the recording
    if (!status.isRecording) {
      console.log("onRecordingStatusUpadte, not recording", status);
      setCurrentRecordingState(recordingState.PAUSED);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>On an iOS device:</Text>
      <Text style={styles.text}>
        Start recording and call yourself while recording.
      </Text>
      <Text style={styles.text}>
        Try to record some more and checkout if you still have the first part of
        your recording.
      </Text>
      {(currentRecordingState === recordingState.NOT_STARTED ||
        currentRecordingState === recordingState.PAUSED) && (
        <Button title={"Start Recording"} onPress={startRecording} />
      )}
      {currentRecordingState === recordingState.RECORDING && (
        <Button title={"Pause Recording"} onPress={pauseRecording} />
      )}
      {(currentRecordingState === recordingState.RECORDING ||
        currentRecordingState === recordingState.PAUSED) && (
        <Button title={"Stop Recording"} onPress={stopRecording} />
      )}
      <Button title="Play Sound" onPress={playSound} disabled={!audioURI} />
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
    marginBottom: 10,
  },
});
