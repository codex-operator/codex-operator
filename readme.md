# GitHub Issues Bounce Badge

Dynamic SVG badge that fetches the latest 5 authors who opened issues in a specified GitHub repository and renders them bouncing around like DVD logos.

## How to deploy

1. Fork or clone this repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your repository. Vercel will automatically detect it as a serverless project.
4. Deploy!

## Usage

Once deployed, Vercel will give you a domain (e.g., `https://my-badge-project.vercel.app`). 
You can use it in any Markdown file by passing the `user` and `repo` query parameters.

### Example in Markdown:

![Heroes Board](https://codex-operator.vercel.app/api?user=codex-operator&repo=codex-operator)
