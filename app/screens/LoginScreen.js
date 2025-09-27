import { View, Text } from 'react-native'
import React from 'react'
import { auth } from './firebase'; // adjust the path if needed

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, ]

const LoginScreen = () => {
  return (
    <View>
      <Text>LoginScreen</Text>
    </View>
  )
}

export default LoginScreen