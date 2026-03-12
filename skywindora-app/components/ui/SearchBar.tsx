import { View, TextInput, StyleSheet } from "react-native";
import { useState } from "react";

type Props = {
  onSearch: (value: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSearch(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search city or airport..."
        placeholderTextColor="#6b7280"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        style={styles.input}

        /* THIS REMOVES RED UNDERLINE ON ANDROID */
        underlineColorAndroid="transparent"

        autoCapitalize="characters"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
    color: "#ffffff",
    fontSize: 16,
  },
});