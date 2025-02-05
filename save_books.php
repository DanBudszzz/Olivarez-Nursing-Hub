<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jsonData = file_get_contents("php://input");
    file_put_contents("books.json", $jsonData);
    echo json_encode(["message" => "Books updated successfully"]);
}
?>