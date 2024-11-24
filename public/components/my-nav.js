// Define a new custom element
class MyNav extends HTMLElement {
  constructor() {
    super();

    // Attach a shadow DOM to the element
    const shadow = this.attachShadow({ mode: 'open' });

    // Create the navigation structure
    const nav = document.createElement('nav');

    nav.innerHTML = `
    <style>
      nav {
        background-color: #333;
        color: white;
        padding: 1em;
        margin-bottom: 1em;
        border-radius: 5px;
        display: flex;
        justify-content: end;
      }
      ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      li {
        float: left;
      }
      li a {
        display: block;
        color: white;
        text-align: center;
        padding: 14px 16px;
        text-decoration: none;
      }
      li a:hover {
        background-color: #111;
        border-radius: 5px;
      }
    </style>
    <ul class="nav">
      <li><a href="/index.html">Residents</a></li>
      <li><a href="/healthRecords/page.html">Health Records</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
    `;

    // Attach the navigation to the shadow DOM
    shadow.appendChild(nav);
  }
}

// Register the custom element
customElements.define('my-nav', MyNav);

