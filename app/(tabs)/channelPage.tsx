import { StyleSheet, Text, View } from "react-native";

interface ChannelPageProps {
    id: number;
  name: string;
  img: string;
  creator: string;
  theme: {
    primary_color: string;
    primary_color_dark: string;
    accent_color: string;
    text_color: string;
    accent_text_color: string;
  };
  users: string[];
}

export default function ChannelPage(){
    const hasError : boolean = false;
     
    return (
        <View style={styles.container}>
            <Text style={styles.titles}>Congrats u are connected</Text>
            
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems:"center",
        justifyContent:"center"
    },
    titles: {
        fontWeight:"bold",
        fontSize:20,
    },
    textInputs: {
        color : "rgba(0, 0, 0, 1)",
    },
    errorMessage: {
        color: "red",
        fontSize:10,

    }
})