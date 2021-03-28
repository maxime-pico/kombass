# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


# Plan
// 1. Représenter une matrice avec certaines valeurs dedans
// 2. Changer la valeur des cases en fonction d'un event
// 3. Instancier les valeurs en fonction d'une matrice
// 4. Alterner les "tours"
// 5. Selectionner un élément quand c'est son tour
// 6. Bouger l'élément avec un second click
// 7. Attendre les deux séléctions, appliquer le mouvement uniquement au click du bouton
// 8. Implémenter systeme de vies futuremove -> matrice taille du plateau contenant vie et player resultant, parcourir la matrice au moment de applymoves pour voir où il y a des éléments
// 9. Gérer plusieurs unités par joueur
// 10. Ajuster le système de vie pour tenir en compte une zone d'attaque
// 11. Sauter le tour des unités mortes
// 12. Si mort avec drapeau alors retour position d'origine
// 13. Implémenter zones où il n'est pas possible de se déplacer
// 14. Implémenter zone où on ne peut pas prendre des dégats
// 15. Visualiser zone de dégats
16. Visualiser type d'unités
// 17. Reduire longueur du plateau
18. Implémenter victoire

# regles
* 3 unités par type max
* Zone de danger en fonction du type d'unités
* zone de non droit pour le joueur autour du drapeau
* placement seulement sur la troisieme colonne

0 1 2 3 4
5 6 7 8 9
10
0 1 2 