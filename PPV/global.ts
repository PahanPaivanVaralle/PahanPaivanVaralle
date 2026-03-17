import {StyleSheet} from "react-native";


export const styles = StyleSheet.create({
    imageBackground: {
        flex: 1,
        resizeMode: 'cover',
    },
    background: {
        backgroundColor: "#E4ACEA",
    },
 
    container: {
        flex: 1,                
        justifyContent: "flex-start", 
        alignItems: "center",    
        paddingTop: 50,

    },
    TextContainer: {
        marginTop: 50,
        alignSelf: 'center',
        width: '90%',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        
    },
    textStyle: {
        fontSize: 30,
        color: '#333',
        textAlign: 'center',
        flexWrap: 'wrap'
    },
    imageStyle: {
        flex: 1,
        height: 200,
        borderRadius: 15,
        marginTop: 50,

    },
    imageContainer: {
        margin: 20,
        flexDirection: 'row',
        gap: 10,
        padding: 20,
        borderRadius: 15,
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        width: '90%',    
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
}); // värit taustalle #B5DACE, #ECC0D1