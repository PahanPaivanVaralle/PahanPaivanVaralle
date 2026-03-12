import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';


export default function Home() {
    return (
        
        <View style={styles.container}>
            <View style={styles.TextContainer}>
                <Text style={styles.textStyle}>
                    Tähän voi tulla sitä tekstiä yms.....
                    asdddssssssssssssssssssssssssssssssssssss
                    sssssssssssssssssssssssssssssssssss
                    ssssMikko Tykkää Pojista ja ehkä tytöistä
                   
                   
                </Text>
            </View>
            <View style={styles.imageContainer}>
                <Image
                    source={require('../assets/cat.png')}
                    style={styles.imageStyle}
                />
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.imageStyle}
                />
            </View>
            <StatusBar style="auto" />
        </View>
    );
}


const styles = StyleSheet.create({
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
}
});
