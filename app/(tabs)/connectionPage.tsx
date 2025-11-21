import { Button, StyleSheet, Text, TextInput, View } from "react-native";


export default function ConnectionPage(){
    const hasError : boolean = false;
     
    return (
        <View style={styles.container}>
            <Text style={styles.titles}>Username</Text>
            <TextInput style={styles.textInputs} placeholder="Enter username" placeholderTextColor={"#d3d3d3"}/>
            <Text style={styles.titles}> Password</Text>
            <TextInput style={styles.textInputs} secureTextEntry={true} placeholder="Enter password" placeholderTextColor={"#d3d3d3"}/>
            <Text style={{...styles.errorMessage, opacity: hasError?1:0}}> Wrong username or password. Please try again.</Text>
            <Button title="Connect"/>
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