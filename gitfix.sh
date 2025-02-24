mkdir recovered_blobs
for blob in $(git fsck --lost-found | awk '/dangling blob/ {print $3}'); do
    git show $blob > recovered_blobs/$blob.txt
done
