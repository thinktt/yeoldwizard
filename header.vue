
<template>
  <header>
    <span> 
      <span class="hamburger" @mouseover="switchNav">☰</span> 
      <span class="main-title">Ye Old Wizard</span>
    </span>

    <span v-if="signInFailed" class="sign-in error" @click=signOut>
      <span> Failed to Sign in! </span>
      <div class="knight dead">♞</div>
    </span>

    <span v-else-if="user" class="sign-in">
      <span @mouseover="toggleSignOut(true)">Signed in as {{user}}</span>
      <div class="knight">♞</div>
      <div @mouseout="toggleSignOut(false)" v-if="shouldShowSignOut">
        <div @click="signOut" class="sign-out">Sign Out</div>
      </div>
    </span>
    
    <span v-else-if="user === null" class="sign-in">
      <span> Connecting to Lichess </span>
      <div class="knight spin">♞</div>
    </span>

    
    <span v-else class="sign-in">
      <a :href="signInLink">Sign In With Lichess</a>
      <div class="knight">♞</div>
    </span>

  </header>
</template>

<style scoped> 
  
</style>