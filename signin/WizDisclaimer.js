import { html } from '../pageTools.js'


const template = html`
  <main class="front-wall disclaimer">
    <h1 class="down-title">Ye Old Wizard</h1>
    <!-- <img class="face" src="images/faces/Dude.png" :alt="Wizard"> -->
    <!-- <h2> The Wiz is Offline </h2> -->
    <h2>Legal Disclaimer</h2>
    
    <p>
      This website is a fan-based, non-profit web application operating without monetary gain and is not affiliated, endorsed, or sponsored by the creators, developers, or publishers of "The Chessmaster" game or "The King" chess engine. All trademarks, copyrights, and other intellectual property rights associated with "The Chessmaster" and "The King" chess engine are the property of their respective owners.  
    </p>
    
    <p>
      By using this website, you acknowledge and agree that you must own a legitimate copy of "The Chessmaster" game and "The King" chess engine. In order to use certain features of this website, you may be required to upload the core software for "The King" chess engine. You represent and warrant that you have the legal right to upload this software, and that you will not upload any files or data for which you do not have the necessary rights and permissions.
    </p>
      
    <p>
      The images and data used on this website are for informational, educational, and entertainment purposes only. We do not claim any ownership or rights over these materials, and any use of these materials on this website is intended to be a fair use under applicable copyright laws.
    </p>
      
    <p>
      We make no warranties or representations about the accuracy, reliability, or completeness of the information, data, or materials provided on this website. We also disclaim any warranties or representations regarding the compatibility or performance of this website with "The Chessmaster" game or "The King" chess engine. You use this website and its features at your own risk, and we shall not be liable for any damages, losses, or expenses resulting from your use of this website or your reliance on any information, data, or materials provided herein.
    </p>
      
    <p>
      If you are the owner of any intellectual property rights used on this website and believe that your rights have been infringed, please contact us at [your email address] so that we can address your concerns and, if necessary, remove any infringing materials.
    </p>
      
    <p>
      By using this website, you agree to indemnify, defend, and hold harmless the website's creators, developers, and operators from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising out of your use of this website or your violation of any applicable laws or regulations.
    </p>
      
    <p>
      We reserve the right to modify, update, or discontinue this website at any time without notice, and we do not guarantee the continued availability or functionality of the website or any of its features.
    </p>
      
    <p>
      Your use of this website constitutes your acceptance of this legal disclaimer, and your continued use of the website signifies your agreement to any modifications or updates to this disclaimer that may be posted from time to time.
    </p>

    <a class="button yellow" @click="$emit('accept')">I Accept</a>
  </main>
`

export default {
  name: 'WizDisclaimer',
  template,
  functional: true,
}