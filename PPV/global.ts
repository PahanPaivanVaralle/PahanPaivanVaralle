import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    background: {
        backgroundColor: "#E4ACEA",
    },
    container: {
        flex: 1,
        flexDirection: 'column',

    },
    TextContainer: {
        marginTop: 50,
        alignSelf: 'center',
        width: '90%',
        backgroundColor: '#ffbff2',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 20,
    },
    textStyle: {
        fontSize: 30,
        color: '#333',
        textAlign: 'center',
    },
    imageStyle: {
        flex: 1,
        height: 200,
        borderRadius: 15,
        marginTop: 50,

    },
    imageContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    CameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 50,
        alignSelf: "center",
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "white",
        borderWidth: 5,
        borderColor: "gray",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    permissionButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#007AFF",
        borderRadius: 8,
    },
    permissionButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    map: {
        flex: 1,
    }
});