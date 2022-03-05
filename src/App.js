import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from 'yup'
import './App.css';
import abi from "./utils/MunchPortal.json";

export default function App() {
  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");

  const [allMeals, setAllMeals] = useState([]);
  const contractAddress = "0x58e4b3830e0FDdeb90eD22b6CbEa55c49cecFd6b";
  const contractABI = abi.abi;

  const getAllMeals = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const munchPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const meals = await munchPortalContract.getAllMeals();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let mealsCleaned = [];
        meals.forEach(meal => {
          mealsCleaned.push({
            address: meal.muncher,
            timestamp: new Date(meal.timestamp * 1000),
            what: meal.what,
            where: meal.where,
            why: meal.why
          });
        });

        /*
         * Store our data in React State
         */
        setAllMeals(mealsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let mealPortalContract;
  
    const onNewMunch = (from, timestamp, what, where, why) => {
      console.log("NewMunch", from, timestamp, what, where, why);
      setAllMeals(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          what,
          where,
          why
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      mealPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      mealPortalContract.on("NewMunch", onNewMunch);
    }
  
    return () => {
      if (mealPortalContract) {
        mealPortalContract.off("NewMunch", onNewMunch);
      }
    };
  }, []);
  
  const checkIfWalletIsConnected = async () => {
   try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        await getAllMeals();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllMeals();
    } catch (error) {
      console.log(error)
    }
  }
  
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  
  const munch = async (what, where, why) => {
      try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const munchPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  
          let count = await munchPortalContract.getTotalMeals();
          console.log("Retrieved total meal count...", count.toNumber());

          const munchTxn = await munchPortalContract.munch(what, where, why, { gasLimit: 300000 });
          console.log('Mining...', munchTxn.hash);

          await munchTxn.wait();
          console.log('Mined --', munchTxn.hash);

          count = await munchPortalContract.getTotalMeals();
          console.log('Retrieved total meal count...', count.toNumber());
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error);
      }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <img 
        src='https://see.fontimg.com/api/renderfont4/nRLyO/eyJyIjoiZnMiLCJoIjoxNzgsInciOjIwMDAsImZzIjo4OSwiZmdjIjoiI0Q1QjBFMCIsImJnYyI6IiNGNEU5RTkiLCJ0IjoxfQ/TXVuY2hraW4/alloy-ink.png'
        alt='Munchkin'>

        </img>
        {/* <div className="logoHeader">
        Munchkin
        </div> */}

        <div className="bio">
        <p>Share the best eats on the blockchain.</p> 
        </div>
        <div className="formik">
          
          <Formik
            initialValues={{ 
              what: "", 
              where: "", 
              why: "" 
            }}
            validationSchema={Yup.object().shape({
            what: Yup.string()
              .min(2, 'Too Short!')
              .max(25, 'Too Long!')
              .required('Required!'),
            where: Yup.string()
              .min(2, 'Too Short!')
              .max(25, 'Too Long!')
              .required('Required!'),
            why: Yup.string()
              .min(2, 'Too Short!')
              .max(25, 'Too Long!')
              .required('Required!')
          })}
            onSubmit={values => {
              console.log(values)
              munch(values.what, values.where, values.why)
            }}
        >
          {({ errors, touched }) => (
            <Form className="formik">
              <Field 
                name="what" 
                className="field"
                placeholder="What did you eat?"/>
              <ErrorMessage name="what" />
              <Field 
                name="where" 
                className="field"
                placeholder="Where did you eat it?"/>
              <ErrorMessage name="where" />
              <Field 
                name="why" 
                className="field"
                placeholder="Why must we know?"/>
              <ErrorMessage name="why" />
              {currentAccount && 
              (
              <button 
                type="submit"
                className='button'
                //onClick={onSubmit}
                >
                Munch!</button>
              )}
            </Form>
          )}
          </Formik>
          {!currentAccount && 
            (
          <button className="button" 
            onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
          <p className='header'>Immortal Meals</p>
          {allMeals.map((meal, index) => {
          return (
            <div key={index} className='mealCard' >
              <div>Address: {meal.address}</div>
              <div>Time: {meal.timestamp.toString()}</div>
              <div>What: {meal.what}</div>
              <div>Where: {meal.where}</div>
              <div>Why: {meal.why}</div>
            </div>)
        })}
        </div>
      </div>
    </div>
  );
}

